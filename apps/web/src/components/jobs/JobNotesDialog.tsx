import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import type { JobPostingItem } from "@/lib/api/jobs";
import { useState } from "react";

interface JobNotesDialogProps {
	job: JobPostingItem | null;
	isSaving: boolean;
	error: Error | null;
	onOpenChange: (open: boolean) => void;
	onSave: (notes: string | null) => void;
}

function JobNotesForm({
	job,
	isSaving,
	error,
	onCancel,
	onSave,
}: {
	job: JobPostingItem;
	isSaving: boolean;
	error: Error | null;
	onCancel: () => void;
	onSave: (notes: string | null) => void;
}) {
	const initialNotes = job.trackingNotes || "";
	const [draft, setDraft] = useState(initialNotes);
	const normalizedDraft = draft.trim();
	const hasChanges = normalizedDraft !== initialNotes.trim();

	return (
		<form
			onSubmit={(event) => {
				event.preventDefault();
				onSave(normalizedDraft || null);
			}}
		>
			<DialogHeader>
				<DialogTitle>求职备注</DialogTitle>
				<DialogDescription className="line-clamp-2 pr-6">
					{job.title}
					{job.company ? ` · ${job.company}` : ""}
				</DialogDescription>
			</DialogHeader>

			<div className="mt-4 space-y-2">
				<label htmlFor={`job-notes-${job.id}`} className="text-sm font-medium">
					备注
				</label>
				<textarea
					id={`job-notes-${job.id}`}
					value={draft}
					onChange={(event) => setDraft(event.target.value)}
					maxLength={5000}
					rows={7}
					placeholder="记录联系人、投递进度或面试安排"
					className="min-h-36 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
				/>
				<div className="flex min-h-5 items-center justify-between gap-3 text-xs">
					<span className="text-destructive">
						{error ? "备注保存失败" : ""}
					</span>
					<span className="text-muted-foreground">{draft.length}/5000</span>
				</div>
			</div>

			<DialogFooter className="mt-4">
				<Button
					type="button"
					variant="outline"
					onClick={onCancel}
					disabled={isSaving}
				>
					取消
				</Button>
				<Button type="submit" disabled={isSaving || !hasChanges}>
					{isSaving ? "保存中" : "保存"}
				</Button>
			</DialogFooter>
		</form>
	);
}

export function JobNotesDialog({
	job,
	isSaving,
	error,
	onOpenChange,
	onSave,
}: JobNotesDialogProps) {
	if (!job) {
		return null;
	}

	return (
		<Dialog open onOpenChange={onOpenChange}>
			<DialogContent>
				<JobNotesForm
					key={job.id}
					job={job}
					isSaving={isSaving}
					error={error}
					onCancel={() => onOpenChange(false)}
					onSave={onSave}
				/>
			</DialogContent>
		</Dialog>
	);
}
