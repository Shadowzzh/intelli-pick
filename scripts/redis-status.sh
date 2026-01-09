#!/bin/bash

# IntelliPick Redis 状态检查脚本
# 使用方法: ./scripts/redis-status.sh

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# 队列名称
QUEUE_NAME="intellipick-pipeline"

echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}  IntelliPick - Redis 状态检查${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 1. 检查 Redis 连接
echo -e "${BOLD}📡 连接状态${NC}"
if redis-cli ping > /dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} Redis 连接正常"
else
    echo -e "  ${RED}✗${NC} Redis 连接失败"
    exit 1
fi
echo ""

# 2. 基本信息
echo -e "${BOLD}📊 基本信息${NC}"
DBSIZE=$(redis-cli DBSIZE)
MEMORY=$(redis-cli INFO memory | grep "used_memory_human:" | cut -d: -f2 | tr -d '\r')
PEAK_MEMORY=$(redis-cli INFO memory | grep "used_memory_peak_human:" | cut -d: -f2 | tr -d '\r')
TOTAL_CONNECTIONS=$(redis-cli INFO stats | grep "total_connections_received:" | cut -d: -f2 | tr -d '\r')
TOTAL_COMMANDS=$(redis-cli INFO stats | grep "total_commands_processed:" | cut -d: -f2 | tr -d '\r')
EXPIRED_KEYS=$(redis-cli INFO stats | grep "expired_keys:" | cut -d: -f2 | tr -d '\r')
KEYSPACE_HITS=$(redis-cli INFO stats | grep "keyspace_hits:" | cut -d: -f2 | tr -d '\r')
KEYSPACE_MISSES=$(redis-cli INFO stats | grep "keyspace_misses:" | cut -d: -f2 | tr -d '\r')

echo -e "  键总数:       ${YELLOW}${DBSIZE}${NC}"
echo -e "  内存使用:     ${YELLOW}${MEMORY}${NC} (峰值: ${PEAK_MEMORY})"
echo -e "  总连接数:     ${YELLOW}${TOTAL_CONNECTIONS}${NC}"
echo -e "  总命令数:     ${YELLOW}${TOTAL_COMMANDS}${NC}"
echo -e "  过期键数:     ${YELLOW}${EXPIRED_KEYS}${NC}"

# 计算缓存命中率
if [ "$KEYSPACE_HITS" != "0" ] || [ "$KEYSPACE_MISSES" != "0" ]; then
    TOTAL_REQUESTS=$((KEYSPACE_HITS + KEYSPACE_MISSES))
    HIT_RATE=$(awk "BEGIN {printf \"%.1f\", ($KEYSPACE_HITS / $TOTAL_REQUESTS) * 100}")
    echo -e "  缓存命中率:   ${YELLOW}${HIT_RATE}%${NC} (${KEYSPACE_HITS} / ${TOTAL_REQUESTS})"
fi
echo ""

# 3. BullMQ 队列状态
echo -e "${BOLD}🔄 BullMQ 队列状态 (${QUEUE_NAME})${NC}"

# 检查队列是否存在
if redis-cli EXISTS "bull:${QUEUE_NAME}:meta" | grep -q "1"; then
    # 获取版本
    VERSION=$(redis-cli HGET "bull:${QUEUE_NAME}:meta" "version" | tr -d '\r')
    CURRENT_ID=$(redis-cli GET "bull:${QUEUE_NAME}:id" | tr -d '\r')

    # 获取队列长度
    WAIT_COUNT=$(redis-cli LLEN "bull:${QUEUE_NAME}:wait" 2>/dev/null || echo "0")
    ACTIVE_COUNT=$(redis-cli LLEN "bull:${QUEUE_NAME}:active" 2>/dev/null || echo "0")
    COMPLETED_COUNT=$(redis-cli ZCARD "bull:${QUEUE_NAME}:completed" 2>/dev/null || echo "0")
    FAILED_COUNT=$(redis-cli ZCARD "bull:${QUEUE_NAME}:failed" 2>/dev/null || echo "0")
    DELAYED_COUNT=$(redis-cli ZCARD "bull:${QUEUE_NAME}:delayed" 2>/dev/null || echo "0")
    EVENT_COUNT=$(redis-cli XLEN "bull:${QUEUE_NAME}:events" 2>/dev/null || echo "0")

    echo -e "  版本:         ${YELLOW}${VERSION}${NC}"
    echo -e "  当前任务 ID:  ${YELLOW}${CURRENT_ID}${NC}"
    echo -e "  等待队列:     ${YELLOW}${WAIT_COUNT}${NC} 个任务"
    echo -e "  活跃队列:     ${YELLOW}${ACTIVE_COUNT}${NC} 个任务"
    echo -e "  已完成:       ${GREEN}${COMPLETED_COUNT}${NC} 个任务"
    echo -e "  失败任务:     ${RED}${FAILED_COUNT}${NC} 个任务"
    echo -e "  延迟任务:     ${YELLOW}${DELAYED_COUNT}${NC} 个任务"
    echo -e "  事件流长度:   ${YELLOW}${EVENT_COUNT}${NC} 条事件"
else
    echo -e "  ${YELLOW}⚠${NC} 队列不存在或尚未初始化"
fi
echo ""

# 4. 最近的任务事件
echo -e "${BOLD}📝 最近任务记录 (最新 5 条)${NC}"
if redis-cli EXISTS "bull:${QUEUE_NAME}:events" | grep -q "1"; then
    # 获取最近的事件
    EVENTS=$(redis-cli XREVRANGE "bull:${QUEUE_NAME}:events" + - COUNT 5 2>/dev/null)

    if [ -n "$EVENTS" ]; then
        # 解析事件（简化版）
        echo "$EVENTS" | while read -r line; do
            if [[ "$line" =~ ^[0-9]+-[0-9]+$ ]]; then
                # 事件 ID
                continue
            elif [ "$line" = "event" ]; then
                read -r event_type
                case "$event_type" in
                    "completed")
                        read -r _ # jobId
                        read -r job_id
                        read -r _ # returnvalue
                        read -r return_value

                        # 判断成功或失败
                        if echo "$return_value" | grep -q '"success":true'; then
                            echo -e "  ${GREEN}✓${NC} ${job_id} - 成功"
                        else
                            echo -e "  ${RED}✗${NC} ${job_id} - 失败"
                        fi
                        ;;
                    "failed")
                        read -r _ # jobId
                        read -r job_id
                        echo -e "  ${RED}✗${NC} ${job_id} - 错误"
                        ;;
                    "drained")
                        echo -e "  ${BLUE}ℹ${NC} 队列已排空"
                        ;;
                    "active")
                        read -r _ # jobId
                        read -r job_id
                        echo -e "  ${CYAN}→${NC} ${job_id} - 处理中"
                        ;;
                    "waiting")
                        read -r _ # jobId
                        read -r job_id
                        echo -e "  ${YELLOW}⋯${NC} ${job_id} - 等待中"
                        ;;
                esac
            fi
        done | head -n 10
    else
        echo -e "  ${YELLOW}⚠${NC} 暂无事件记录"
    fi
else
    echo -e "  ${YELLOW}⚠${NC} 事件流不存在"
fi
echo ""

# 5. 所有键列表
echo -e "${BOLD}🔑 Redis 键列表${NC}"
KEYS=$(redis-cli KEYS "*" | sort)
if [ -n "$KEYS" ]; then
    echo "$KEYS" | while read -r key; do
        KEY_TYPE=$(redis-cli TYPE "$key" | tr -d '\r')
        case "$KEY_TYPE" in
            "string")
                VALUE=$(redis-cli GET "$key" | head -c 50)
                echo -e "  ${CYAN}${key}${NC} (${KEY_TYPE}): ${VALUE}..."
                ;;
            "list")
                LEN=$(redis-cli LLEN "$key")
                echo -e "  ${CYAN}${key}${NC} (${KEY_TYPE}): ${LEN} 项"
                ;;
            "zset")
                COUNT=$(redis-cli ZCARD "$key")
                echo -e "  ${CYAN}${key}${NC} (${KEY_TYPE}): ${COUNT} 项"
                ;;
            "hash")
                COUNT=$(redis-cli HLEN "$key")
                echo -e "  ${CYAN}${key}${NC} (${KEY_TYPE}): ${COUNT} 字段"
                ;;
            "stream")
                LEN=$(redis-cli XLEN "$key")
                echo -e "  ${CYAN}${key}${NC} (${KEY_TYPE}): ${LEN} 条"
                ;;
            *)
                echo -e "  ${CYAN}${key}${NC} (${KEY_TYPE})"
                ;;
        esac
    done
else
    echo -e "  ${YELLOW}⚠${NC} Redis 为空"
fi
echo ""

echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}✓ 检查完成${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
