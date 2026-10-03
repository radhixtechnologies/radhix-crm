import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { hrmService } from '../../../services/hrmService';
import { useAuth } from '../../../context/AuthContext'; // Assuming context exists
import Loader from '../../../components/common/Loader';
import {
    FiChevronLeft, FiPlus, FiEdit2, FiTrash2, FiCheckCircle,
    FiPlayCircle, FiFileText, FiImage, FiHelpCircle, FiChevronDown, FiChevronRight,
    FiSave, FiX
} from 'react-icons/fi';
import '../../../styles/employee/employee-profile.css'; // Reusing some profile styles for layout

const TrainingDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user, isAdmin, isSuperAdmin } = useAuth();
    const [training, setTraining] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeModuleIndex, setActiveModuleIndex] = useState(0);
    const [activeContentIndex, setActiveContentIndex] = useState(0);
    const [editMode, setEditMode] = useState(false);

    // Draft states for editing
    const [draftTraining, setDraftTraining] = useState(null);

    useEffect(() => {
        fetchTraining();
    }, [id]);

    const fetchTraining = async () => {
        try {
            setLoading(true);
            const res = await hrmService.getTraining(id);
            if (res.data.success) {
                setTraining(res.data.data);
                setDraftTraining(res.data.data);
            }
        } catch (error) {
            console.error('Error fetching training:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (enrollmentId, newStatus) => {
        try {
            const res = await hrmService.updateEnrollment(id, enrollmentId, { status: newStatus });
            if (res.data.success) {
                setTraining(res.data.data);
                // Show success message
                const statusText = newStatus.charAt(0).toUpperCase() + newStatus.slice(1).replace('-', ' ');
                alert(`Enrollment status updated to: ${statusText}`);
            }
        } catch (error) {
            console.error('Error updating enrollment status:', error);
            alert('Failed to update enrollment status');
        }
    };

    const handleSave = async () => {
        try {
            await hrmService.updateTraining(id, draftTraining);
            setTraining(draftTraining);
            setEditMode(false);
            alert('Training updated successfully');
        } catch (error) {
            console.error(error);
            alert('Failed to update training');
        }
    };

    const addModule = () => {
        const newModule = {
            title: 'New Module',
            description: '',
            contents: []
        };
        setDraftTraining({
            ...draftTraining,
            modules: [...(draftTraining.modules || []), newModule]
        });
    };

    const addContent = (moduleIndex, type) => {
        const newContent = {
            title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
            type: type,
            data: type === 'text' ? { text: '' } : type === 'quiz' ? { questions: [] } : { url: '' }
        };

        const updatedModules = [...draftTraining.modules];
        updatedModules[moduleIndex].contents.push(newContent);

        setDraftTraining({
            ...draftTraining,
            modules: updatedModules
        });
    };

    const updateModuleTitle = (index, title) => {
        const updatedModules = [...draftTraining.modules];
        updatedModules[index].title = title;
        setDraftTraining({ ...draftTraining, modules: updatedModules });
    };

    const updateContent = (moduleIndex, contentIndex, field, value) => {
        const updatedModules = [...draftTraining.modules];
        if (field === 'title') {
            updatedModules[moduleIndex].contents[contentIndex].title = value;
        } else if (field === 'data') {
            updatedModules[moduleIndex].contents[contentIndex].data = {
                ...updatedModules[moduleIndex].contents[contentIndex].data,
                ...value
            };
        }
        setDraftTraining({ ...draftTraining, modules: updatedModules });
    };

    const deleteContent = (moduleIndex, contentIndex) => {
        const updatedModules = [...draftTraining.modules];
        updatedModules[moduleIndex].contents.splice(contentIndex, 1);
        setDraftTraining({ ...draftTraining, modules: updatedModules });
    };

    const deleteModule = (moduleIndex) => {
        const updatedModules = [...draftTraining.modules];
        updatedModules.splice(moduleIndex, 1);
        setDraftTraining({ ...draftTraining, modules: updatedModules });
        if (activeModuleIndex >= updatedModules.length) {
            setActiveModuleIndex(Math.max(0, updatedModules.length - 1));
        }
    };

    if (loading) return <Loader />;
    if (!training) return <div>Training not found</div>;

    const activeModule = (editMode ? draftTraining : training).modules?.[activeModuleIndex];
    const activeContent = activeModule?.contents?.[activeContentIndex];

    const canEdit = isAdmin || isSuperAdmin; // Or check creator ID

    return (
        <div className="training-details-page" style={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
            {/* Sidebar - Modules List */}
            <div style={{ width: '300px', borderRight: '1px solid #e5e7eb', background: 'white', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }}>
                    <button className="btn-ghost" onClick={() => navigate('/hrm/training')} style={{ marginBottom: '8px', padding: 0, display: 'flex', alignItems: 'center', gap: '4px', color: '#6b7280' }}>
                        <FiChevronLeft /> Back to Catalog
                    </button>
                    <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: 0 }}>
                        {editMode ? (
                            <input
                                type="text"
                                value={draftTraining.title}
                                onChange={(e) => setDraftTraining({ ...draftTraining, title: e.target.value })}
                                style={{ width: '100%', padding: '4px', border: '1px solid #d1d5db', borderRadius: '4px' }}
                            />
                        ) : training.title}
                    </h2>

                    {canEdit && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {editMode ? (
                                <>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                        <label style={{ fontSize: '13px', color: '#4b5563', fontWeight: 500 }}>Status:</label>
                                        <select
                                            value={draftTraining.status || 'draft'}
                                            onChange={(e) => setDraftTraining({ ...draftTraining, status: e.target.value })}
                                            style={{
                                                flex: 1,
                                                padding: '4px 8px',
                                                borderRadius: '4px',
                                                border: '1px solid #d1d5db',
                                                fontSize: '13px',
                                                background: 'white'
                                            }}
                                        >
                                            <option value="draft">Draft (Hidden)</option>
                                            <option value="scheduled">Scheduled (Visible)</option>
                                            <option value="in-progress">In Progress (Visible)</option>
                                            <option value="completed">Completed</option>
                                            <option value="cancelled">Cancelled</option>
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button className="btn btn-primary btn-sm" onClick={handleSave} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <FiSave /> Save
                                        </button>
                                        <button className="btn btn-outline btn-sm" onClick={() => { setEditMode(false); setDraftTraining(training); }} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                            <FiX /> Cancel
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <span style={{
                                            fontSize: '11px',
                                            padding: '2px 8px',
                                            borderRadius: '10px',
                                            background: training.status === 'scheduled' || training.status === 'in-progress' ? '#dcfce7' : '#f3f4f6',
                                            color: training.status === 'scheduled' || training.status === 'in-progress' ? '#166534' : '#6b7280',
                                            fontWeight: 600,
                                            textTransform: 'uppercase'
                                        }}>
                                            {training.status}
                                        </span>
                                    </div>
                                    <button className="btn btn-outline btn-sm" onClick={() => setEditMode(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                                        <FiEdit2 /> Edit Course
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: '12px' }}>
                    {(editMode ? draftTraining : training).modules?.map((module, mIndex) => (
                        <div key={mIndex} style={{ marginBottom: '16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', padding: '4px 8px', background: '#f3f4f6', borderRadius: '6px' }}>
                                {editMode ? (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                                        <input
                                            value={module.title}
                                            onChange={(e) => updateModuleTitle(mIndex, e.target.value)}
                                            style={{ flex: 1, border: 'none', background: 'transparent', fontWeight: 600, fontSize: '14px' }}
                                        />
                                        <button onClick={() => deleteModule(mIndex)} style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}><FiTrash2 /></button>
                                    </div>
                                ) : (
                                    <h3 style={{ fontSize: '14px', fontWeight: 600, margin: 0, color: '#374151' }}>{module.title}</h3>
                                )}
                            </div>

                            <div style={{ paddingLeft: '8px' }}>
                                {module.contents?.map((content, cIndex) => (
                                    <div
                                        key={cIndex}
                                        onClick={() => { setActiveModuleIndex(mIndex); setActiveContentIndex(cIndex); }}
                                        style={{
                                            padding: '8px',
                                            borderRadius: '6px',
                                            marginBottom: '4px',
                                            cursor: 'pointer',
                                            background: (activeModuleIndex === mIndex && activeContentIndex === cIndex) ? '#eff6ff' : 'transparent',
                                            color: (activeModuleIndex === mIndex && activeContentIndex === cIndex) ? '#2563eb' : '#4b5563',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            fontSize: '13px'
                                        }}
                                    >
                                        {content.type === 'video' && <FiPlayCircle />}
                                        {content.type === 'text' && <FiFileText />}
                                        {content.type === 'image' && <FiImage />}
                                        {content.type === 'quiz' && <FiHelpCircle />}

                                        <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{content.title}</span>

                                        {editMode && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteContent(mIndex, cIndex); }}
                                                style={{ color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', padding: '2px' }}
                                            >
                                                <FiX size={12} />
                                            </button>
                                        )}
                                    </div>
                                ))}

                                {editMode && (
                                    <div style={{ display: 'flex', gap: '4px', marginTop: '8px' }}>
                                        <button onClick={() => addContent(mIndex, 'text')} className="btn-xs btn-outline" title="Add Text"><FiFileText /></button>
                                        <button onClick={() => addContent(mIndex, 'video')} className="btn-xs btn-outline" title="Add Video"><FiPlayCircle /></button>
                                        <button onClick={() => addContent(mIndex, 'image')} className="btn-xs btn-outline" title="Add Image"><FiImage /></button>
                                        <button onClick={() => addContent(mIndex, 'quiz')} className="btn-xs btn-outline" title="Add Quiz"><FiHelpCircle /></button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Enrollments Section - Only visible to admins */}
                    {canEdit && training.enrollments && training.enrollments.length > 0 && (
                        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' }}>
                            <h3 style={{ fontSize: '13px', fontWeight: 600, color: '#374151', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Enrollments ({training.enrollments.length})
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {training.enrollments.map((enrollment, idx) => (
                                    <div
                                        key={idx}
                                        style={{
                                            padding: '12px',
                                            background: '#f9fafb',
                                            borderRadius: '8px',
                                            fontSize: '12px',
                                            border: '1px solid #e5e7eb'
                                        }}
                                    >
                                        <div style={{ fontWeight: 600, color: '#111827', marginBottom: '6px', fontSize: '13px' }}>
                                            {enrollment.employee?.firstName} {enrollment.employee?.lastName}
                                        </div>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', marginBottom: '8px' }}>
                                            {enrollment.employee?.employeeId && (
                                                <div style={{ color: '#6b7280', fontSize: '11px' }}>
                                                    <strong>ID:</strong> {enrollment.employee.employeeId}
                                                </div>
                                            )}
                                            {enrollment.employee?.email && (
                                                <div style={{ color: '#6b7280', fontSize: '11px' }}>
                                                    <strong>Email:</strong> {enrollment.employee.email}
                                                </div>
                                            )}
                                            {enrollment.employee?.department && (
                                                <div style={{ color: '#6b7280', fontSize: '11px' }}>
                                                    <strong>Dept:</strong> {enrollment.employee.department}
                                                </div>
                                            )}
                                            {enrollment.employee?.designation && (
                                                <div style={{ color: '#6b7280', fontSize: '11px' }}>
                                                    <strong>Role:</strong> {enrollment.employee.designation}
                                                </div>
                                            )}
                                            {enrollment.employee?.phone && (
                                                <div style={{ color: '#6b7280', fontSize: '11px' }}>
                                                    <strong>Phone:</strong> {enrollment.employee.phone}
                                                </div>
                                            )}
                                        </div>

                                        <div style={{
                                            marginTop: '8px',
                                            paddingTop: '8px',
                                            borderTop: '1px solid #e5e7eb',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px',
                                            flexWrap: 'wrap',
                                            justifyContent: 'space-between'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                {(() => {
                                                    const statusColors = {
                                                        'pending': { bg: '#fef3c7', text: '#92400e' },
                                                        'selected': { bg: '#d1fae5', text: '#065f46' },
                                                        'rejected': { bg: '#fee2e2', text: '#991b1b' },
                                                        'in-progress': { bg: '#dbeafe', text: '#1e40af' },
                                                        'completed': { bg: '#a7f3d0', text: '#064e3b' },
                                                        'dropped': { bg: '#f3f4f6', text: '#6b7280' }
                                                    };
                                                    const colors = statusColors[enrollment.status] || statusColors['pending'];

                                                    return (
                                                        <>
                                                            {editMode ? (
                                                                <select
                                                                    value={enrollment.status}
                                                                    onChange={(e) => handleStatusChange(enrollment._id, e.target.value)}
                                                                    style={{
                                                                        padding: '4px 8px',
                                                                        borderRadius: '4px',
                                                                        fontSize: '11px',
                                                                        fontWeight: 600,
                                                                        background: colors.bg,
                                                                        color: colors.text,
                                                                        border: '1px solid ' + colors.text + '40',
                                                                        cursor: 'pointer',
                                                                        outline: 'none'
                                                                    }}
                                                                >
                                                                    <option value="pending">Pending</option>
                                                                    <option value="selected">Selected</option>
                                                                    <option value="rejected">Rejected</option>
                                                                    <option value="in-progress">In Progress</option>
                                                                    <option value="completed">Completed</option>
                                                                    <option value="dropped">Dropped</option>
                                                                </select>
                                                            ) : (
                                                                <span style={{
                                                                    padding: '3px 8px',
                                                                    borderRadius: '4px',
                                                                    fontSize: '10px',
                                                                    fontWeight: 600,
                                                                    background: colors.bg,
                                                                    color: colors.text
                                                                }}>
                                                                    {enrollment.status}
                                                                </span>
                                                            )}
                                                        </>
                                                    );
                                                })()}
                                                {enrollment.enrolledAt && (
                                                    <span style={{ fontSize: '10px', color: '#9ca3af' }}>
                                                        {new Date(enrollment.enrolledAt).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {editMode && (
                        <button
                            onClick={addModule}
                            className="btn btn-outline btn-sm"
                            style={{ width: '100%', borderStyle: 'dashed', marginTop: '12px' }}
                        >
                            <FiPlus /> Add Module
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ flex: 1, padding: '24px', overflowY: 'auto', background: '#f9fafb' }}>
                {activeModule ? (
                    <div style={{ maxWidth: '800px', margin: '0 auto', background: 'white', padding: '32px', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                        <div style={{ marginBottom: '24px', paddingBottom: '16px', borderBottom: '1px solid #e5e7eb' }}>
                            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>
                                {activeModule.title}
                            </h1>
                            {activeContent && (
                                <h2 style={{ fontSize: '18px', color: '#4b5563', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {editMode ? (
                                        <input
                                            value={activeContent.title}
                                            onChange={(e) => updateContent(activeModuleIndex, activeContentIndex, 'title', e.target.value)}
                                            style={{ fontSize: '18px', width: '100%', border: '1px solid #d1d5db', borderRadius: '4px', padding: '4px' }}
                                        />
                                    ) : activeContent.title}
                                </h2>
                            )}
                        </div>

                        {activeContent ? (
                            <div>
                                {activeContent.type === 'text' && (
                                    editMode ? (
                                        <textarea
                                            value={activeContent.data?.text || ''}
                                            onChange={(e) => updateContent(activeModuleIndex, activeContentIndex, 'data', { text: e.target.value })}
                                            style={{ width: '100%', minHeight: '300px', padding: '12px', borderRadius: '8px', border: '1px solid #d1d5db', fontFamily: 'inherit' }}
                                            placeholder="Write your lesson content here (Markdown supported)..."
                                        />
                                    ) : (
                                        <div style={{ lineHeight: '1.6', color: '#374151', whiteSpace: 'pre-wrap' }}>
                                            {activeContent.data?.text || 'No content added yet.'}
                                        </div>
                                    )
                                )}

                                {activeContent.type === 'video' && (
                                    <div>
                                        {editMode ? (
                                            <div style={{ marginBottom: '16px' }}>
                                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Video URL (YouTube/Vimeo/MP4)</label>
                                                <input
                                                    type="text"
                                                    value={activeContent.data?.url || ''}
                                                    onChange={(e) => updateContent(activeModuleIndex, activeContentIndex, 'data', { url: e.target.value })}
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                                    placeholder="https://www.youtube.com/watch?v=..."
                                                />
                                                <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                                                    Supports: YouTube (Standard, Mobile, Shorts), Vimeo
                                                </div>
                                            </div>
                                        ) : null}

                                        {activeContent.data?.url ? (
                                            (() => {
                                                const getEmbedUrl = (url) => {
                                                    if (!url) return '';
                                                    try {
                                                        // Handle YouTube
                                                        if (url.includes('youtube.com') || url.includes('youtu.be')) {
                                                            let videoId = '';
                                                            if (url.includes('youtu.be')) {
                                                                videoId = url.split('youtu.be/')[1]?.split('?')[0];
                                                            } else if (url.includes('youtube.com/watch')) {
                                                                videoId = new URLSearchParams(new URL(url).search).get('v');
                                                            } else if (url.includes('youtube.com/embed/')) {
                                                                videoId = url.split('embed/')[1]?.split('?')[0];
                                                            } else if (url.includes('m.youtube.com/watch')) {
                                                                videoId = new URLSearchParams(new URL(url).search).get('v');
                                                            }

                                                            if (videoId) {
                                                                return `https://www.youtube.com/embed/${videoId}`;
                                                            }
                                                        }
                                                        // Basic Vimeo support
                                                        if (url.includes('vimeo.com')) {
                                                            const id = url.split('/').pop();
                                                            return `https://player.vimeo.com/video/${id}`;
                                                        }
                                                        return url; // Return original if not matched (e.g. mp4)
                                                    } catch (e) {
                                                        return url;
                                                    }
                                                };

                                                const embedUrl = getEmbedUrl(activeContent.data.url);

                                                return (
                                                    <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '12px', background: '#000' }}>
                                                        <iframe
                                                            src={embedUrl}
                                                            style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                                                            frameBorder="0"
                                                            allowFullScreen
                                                            title={activeContent.title}
                                                        />
                                                    </div>
                                                );
                                            })()
                                        ) : (
                                            <div style={{ height: '300px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                                <FiPlayCircle size={48} />
                                                <span style={{ marginLeft: '12px' }}>No video URL provided</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeContent.type === 'image' && (
                                    <div>
                                        {editMode ? (
                                            <div style={{ marginBottom: '16px' }}>
                                                <label style={{ display: 'block', marginBottom: '4px', fontSize: '13px', fontWeight: 500 }}>Image URL</label>
                                                <input
                                                    type="text"
                                                    value={activeContent.data?.url || ''}
                                                    onChange={(e) => updateContent(activeModuleIndex, activeContentIndex, 'data', { url: e.target.value })}
                                                    style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #d1d5db' }}
                                                    placeholder="https://example.com/image.png"
                                                />
                                            </div>
                                        ) : null}

                                        {activeContent.data?.url ? (
                                            <img
                                                src={activeContent.data.url}
                                                alt={activeContent.title}
                                                style={{ maxWidth: '100%', borderRadius: '8px' }}
                                            />
                                        ) : (
                                            <div style={{ height: '300px', background: '#f3f4f6', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                                                <FiImage size={48} />
                                                <span style={{ marginLeft: '12px' }}>No image URL provided</span>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#9ca3af' }}>
                                Select a lesson from the sidebar to view content.
                            </div>
                        )}
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', marginTop: '100px', color: '#6b7280' }}>
                        <h2>
                            {editMode
                                ? 'Start Building Your Course'
                                : (training.modules?.length === 0 ? 'Empty Course' : 'Welcome to the Course')}
                        </h2>
                        <p>
                            {editMode
                                ? 'Add your first module to get started.'
                                : (training.modules?.length === 0 ? 'This course has no content yet.' : 'Select a module from the sidebar to begin.')}
                        </p>

                        {editMode ? (
                            <button className="btn btn-primary" onClick={addModule} style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <FiPlus /> Add First Module
                            </button>
                        ) : (
                            canEdit && training.modules?.length === 0 && (
                                <button className="btn btn-primary" onClick={() => setEditMode(true)} style={{ marginTop: '16px', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                    <FiEdit2 /> Start Building Course
                                </button>
                            )
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrainingDetails;
