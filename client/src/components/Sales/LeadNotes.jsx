import React, { useState } from 'react';
import { FiMessageSquare, FiSend, FiUser, FiClock } from 'react-icons/fi';
import { salesService } from '../../services/salesService';
import { formatDate } from '../../utils/format';

const LeadNotes = ({ lead, onUpdate }) => {
    const [noteText, setNoteText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!noteText.trim()) return;

        try {
            setSubmitting(true);
            // Corrected service method call
            await salesService.addLeadNote(lead._id, noteText);
            setNoteText('');
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to add note:', error);
        } finally {
            setSubmitting(false);
        }
    };

    // Sort notes by date desc if they exist
    const notes = lead?.notes ? [...lead.notes].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) : [];

    return (
        <div className="notes-container"> {/* Clean class usage */}
            {/* Note Input */}
            <div className="note-input-wrapper">
                <textarea
                    className="note-textarea"
                    placeholder="Write a note..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                />
                <div className="note-actions">
                    <div className="text-xs text-muted">
                        {/* Optional: icons or formatting tools */}
                    </div>
                    <button
                        className="btn btn-primary btn-sm"
                        onClick={handleSubmit}
                        disabled={submitting || !noteText.trim()}
                        style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                        {submitting ? 'Saving...' : 'Add Note'}
                    </button>
                </div>
            </div>

            {/* Timeline */}
            <div className="timeline">
                {notes.length > 0 ? (
                    notes.map((note, index) => (
                        <div key={note._id || index} className="timeline-item">
                            <div className="timeline-dot bg-blue-500"></div> {/* Use new dot style */}
                            <div className="timeline-content border-none shadow-none p-0"> {/* Override previous styles if needed */}
                                <div className="timeline-header flex justify-between mb-1">
                                    <span className="timeline-user font-semibold text-slate-700">
                                        {note.createdBy?.name || 'User'}
                                    </span>
                                    <span className="timeline-date text-xs text-slate-400">
                                        {formatDate(note.createdAt)}
                                    </span>
                                </div>
                                <div className="timeline-body text-slate-600 text-sm">
                                    {note.content || note.text}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-8 text-muted text-sm">
                        No notes yet. Start the conversation!
                    </div>
                )}
            </div>
        </div>
    );
};

export default LeadNotes;
