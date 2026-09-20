import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiPlus, FiX, FiSearch } from 'react-icons/fi';
import { marketingService } from '../../services/marketingService';
import { employeeService } from '../../services/employeeService';
import { salesService } from '../../services/salesService';
import { contactService } from '../../services/contactService';
import Loader from '../../components/common/Loader';
import '../../styles/marketing/segments.css';
import '../../styles/forms.css';
import '../../styles/sales/lead-form.css';

const AddSegment = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!id);
    const [employees, setEmployees] = useState([]);
    const [leads, setLeads] = useState([]);
    const [contacts, setContacts] = useState([]);
    const [memberTab, setMemberTab] = useState('leads');
    const [memberSearch, setMemberSearch] = useState('');

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        type: 'dynamic',
        owner: '',
        rules: [],
        staticMembers: {
            leads: [],
            contacts: []
        }
    });


    useEffect(() => {
        fetchEmployees();
        if (id) {
            fetchSegment();
        }
    }, [id]);

    useEffect(() => {
        if (formData.type === 'static') {
            fetchLeads();
            fetchContacts();
        }
    }, [formData.type]);

    const fetchEmployees = async () => {
        try {
            const res = await employeeService.getEmployees();
            if (res.data.success) {
                setEmployees(res.data.data || []);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const fetchLeads = async () => {
        try {
            const res = await salesService.getLeads({ limit: 1000 });
            if (res.data.success) {
                setLeads(res.data.data.leads || []);
            }
        } catch (error) {
            console.error('Error fetching leads:', error);
        }
    };

    const fetchContacts = async () => {
        try {
            const res = await contactService.getContacts({ limit: 1000 });
            if (res.data.success) {
                setContacts(res.data.data.contacts || []);
            }
        } catch (error) {
            console.error('Error fetching contacts:', error);
        }
    };


    // Predefined field options matching Lead/Contact forms
    const FIELD_OPTIONS = {
        industry: [
            'Technology', 'Healthcare', 'Finance', 'Education', 'Retail',
            'Manufacturing', 'Real Estate', 'Consulting', 'Marketing',
            'E-commerce', 'Hospitality', 'Transportation', 'Energy',
            'Telecommunications', 'Media', 'Other'
        ],
        status: ['new', 'contacted', 'qualified', 'lost'],
        location: [
            'New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix',
            'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose',
            'Austin', 'Jacksonville', 'San Francisco', 'Mumbai', 'Delhi',
            'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata', 'Pune',
            'London', 'Paris', 'Tokyo', 'Singapore', 'Dubai', 'Other'
        ],
        leadTemperature: ['cold', 'warm', 'hot', 'qualified'],
        source: [
            'website', 'referral', 'social-media', 'email', 'phone',
            'campaign', 'other'
        ],
        companySize: [
            '1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'
        ],
        tags: [
            'VIP', 'Enterprise', 'SMB', 'Startup', 'High Priority',
            'Low Priority', 'Decision Maker', 'Influencer', 'Champion',
            'Blocker', 'Budget Approved', 'Needs Nurturing'
        ]
    };

    const fetchSegment = async () => {
        try {
            setFetching(true);
            const res = await marketingService.getSegment(id);
            if (res.data.success) {
                const segment = res.data.data;
                setFormData({
                    name: segment.name,
                    description: segment.description || '',
                    type: segment.type,
                    owner: segment.owner?._id || segment.owner || '',
                    rules: segment.rules || [],
                    staticMembers: segment.staticMembers || { leads: [], contacts: [] }
                });
            }
        } catch (error) {
            console.error('Error fetching segment:', error);
            alert('Failed to load segment');
            navigate('/marketing/segments');
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (formData.type === 'dynamic' && formData.rules.length === 0) {
            alert('Please add at least one rule for dynamic segments');
            return;
        }

        if (formData.type === 'static') {
            const totalMembers = formData.staticMembers.leads.length + formData.staticMembers.contacts.length;
            if (totalMembers === 0) {
                alert('Please select at least one member for static segments');
                return;
            }
        }

        try {
            setLoading(true);
            if (id) {
                await marketingService.updateSegment(id, formData);
            } else {
                await marketingService.createSegment(formData);
            }
            navigate('/marketing/segments');
        } catch (error) {
            console.error(`Error ${id ? 'updating' : 'creating'} segment:`, error);
            alert(`Failed to ${id ? 'update' : 'create'} segment`);
        } finally {
            setLoading(false);
        }
    };

    // Rule management functions
    const addRule = () => {
        setFormData({
            ...formData,
            rules: [...formData.rules, { field: 'industry', operator: 'equals', value: '' }]
        });
    };

    const removeRule = (index) => {
        setFormData({
            ...formData,
            rules: formData.rules.filter((_, i) => i !== index)
        });
    };

    const updateRule = (index, key, value) => {
        const updatedRules = [...formData.rules];
        updatedRules[index][key] = value;
        setFormData({ ...formData, rules: updatedRules });
    };

    // Member selection functions
    const toggleMember = (memberId) => {
        const memberType = memberTab === 'leads' ? 'leads' : 'contacts';
        const currentMembers = formData.staticMembers[memberType];

        if (currentMembers.includes(memberId)) {
            setFormData({
                ...formData,
                staticMembers: {
                    ...formData.staticMembers,
                    [memberType]: currentMembers.filter(id => id !== memberId)
                }
            });
        } else {
            setFormData({
                ...formData,
                staticMembers: {
                    ...formData.staticMembers,
                    [memberType]: [...currentMembers, memberId]
                }
            });
        }
    };

    const isSelected = (memberId) => {
        const memberType = memberTab === 'leads' ? 'leads' : 'contacts';
        return formData.staticMembers[memberType].includes(memberId);
    };

    const getFilteredMembers = () => {
        const members = memberTab === 'leads' ? leads : contacts;
        if (!memberSearch) return members;

        return members.filter(member =>
            member.name?.toLowerCase().includes(memberSearch.toLowerCase()) ||
            member.email?.toLowerCase().includes(memberSearch.toLowerCase()) ||
            member.company?.toLowerCase().includes(memberSearch.toLowerCase())
        );
    };

    const getSelectedCount = () => {
        return formData.staticMembers.leads.length + formData.staticMembers.contacts.length;
    };

    // Get field options for dropdown
    const getFieldOptions = (field) => {
        return FIELD_OPTIONS[field] || [];
    };

    // Check if field should use dropdown
    const shouldUseDropdown = (field) => {
        return ['industry', 'status', 'location', 'leadTemperature', 'source', 'companySize', 'tags'].includes(field);
    };

    // Get display label for option value
    const getOptionLabel = (field, value) => {
        if (field === 'leadTemperature') {
            const labels = {
                'cold': '🧊 Cold - Just inquiring',
                'warm': '🟡 Warm - Showing interest',
                'hot': '🔥 Hot - Ready to buy',
                'qualified': '✅ Qualified - Meets criteria'
            };
            return labels[value] || value;
        }
        if (field === 'status') {
            return value.charAt(0).toUpperCase() + value.slice(1);
        }
        if (field === 'source') {
            const labels = {
                'website': 'Website',
                'referral': 'Referral',
                'social-media': 'Social Media',
                'email': 'Email',
                'phone': 'Phone',
                'campaign': 'Campaign',
                'other': 'Other'
            };
            return labels[value] || value;
        }
        if (field === 'companySize') {
            return `${value} employees`;
        }
        return value;
    };

    // Render value input based on field type
    const renderValueInput = (rule, index) => {
        const field = rule.field;
        const operator = rule.operator;

        // For date fields
        if (field === 'createdAt') {
            if (operator === 'between') {
                return (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="date"
                            className="form-input rule-value-input"
                            value={rule.value?.split(',')[0] || ''}
                            onChange={(e) => {
                                const values = rule.value?.split(',') || ['', ''];
                                values[0] = e.target.value;
                                updateRule(index, 'value', values.join(','));
                            }}
                            placeholder="Start date"
                        />
                        <input
                            type="date"
                            className="form-input rule-value-input"
                            value={rule.value?.split(',')[1] || ''}
                            onChange={(e) => {
                                const values = rule.value?.split(',') || ['', ''];
                                values[1] = e.target.value;
                                updateRule(index, 'value', values.join(','));
                            }}
                            placeholder="End date"
                        />
                    </div>
                );
            }
            return (
                <input
                    type="date"
                    className="form-input rule-value-input"
                    value={rule.value}
                    onChange={(e) => updateRule(index, 'value', e.target.value)}
                />
            );
        }

        // For numeric fields
        if (field === 'value') {
            if (operator === 'between') {
                return (
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input
                            type="number"
                            className="form-input rule-value-input"
                            value={rule.value?.split(',')[0] || ''}
                            onChange={(e) => {
                                const values = rule.value?.split(',') || ['', ''];
                                values[0] = e.target.value;
                                updateRule(index, 'value', values.join(','));
                            }}
                            placeholder="Min value"
                        />
                        <input
                            type="number"
                            className="form-input rule-value-input"
                            value={rule.value?.split(',')[1] || ''}
                            onChange={(e) => {
                                const values = rule.value?.split(',') || ['', ''];
                                values[1] = e.target.value;
                                updateRule(index, 'value', values.join(','));
                            }}
                            placeholder="Max value"
                        />
                    </div>
                );
            }
            return (
                <input
                    type="number"
                    className="form-input rule-value-input"
                    value={rule.value}
                    onChange={(e) => updateRule(index, 'value', e.target.value)}
                    placeholder="Enter amount"
                />
            );
        }

        // For fields with predefined options (dropdown)
        if (shouldUseDropdown(field)) {
            const options = getFieldOptions(field);

            // If no options available, show text input with hint
            if (options.length === 0) {
                return (
                    <div>
                        <input
                            type="text"
                            className="form-input rule-value-input"
                            value={rule.value}
                            onChange={(e) => updateRule(index, 'value', e.target.value)}
                            placeholder={`No ${field} values found in database. Enter manually.`}
                        />
                        <small style={{ fontSize: '11px', color: '#f59e0b', marginTop: '4px', display: 'block' }}>
                            💡 Add some leads with {field} values first
                        </small>
                    </div>
                );
            }

            // For 'in' and 'not_in' operators, allow multiple selection
            if (operator === 'in' || operator === 'not_in') {
                const selectedValues = rule.value ? rule.value.split(',').map(v => v.trim()) : [];

                return (
                    <select
                        multiple
                        className="form-select rule-value-input"
                        value={selectedValues}
                        onChange={(e) => {
                            const selected = Array.from(e.target.selectedOptions, option => option.value);
                            updateRule(index, 'value', selected.join(', '));
                        }}
                        size="3"
                        style={{ height: 'auto', minHeight: '36px' }}
                    >
                        {options.map(option => (
                            <option key={option} value={option}>{getOptionLabel(field, option)}</option>
                        ))}
                    </select>
                );
            }

            // For other operators, single selection
            return (
                <select
                    className="form-select rule-value-input"
                    value={rule.value}
                    onChange={(e) => updateRule(index, 'value', e.target.value)}
                >
                    <option value="">Select {field} ({options.length} available)</option>
                    {options.map(option => (
                        <option key={option} value={option}>{getOptionLabel(field, option)}</option>
                    ))}
                </select>
            );
        }

        // Default: text input
        return (
            <input
                type="text"
                className="form-input rule-value-input"
                value={rule.value}
                onChange={(e) => updateRule(index, 'value', e.target.value)}
                placeholder="Enter value"
            />
        );
    };

    if (fetching) return <Loader />;

    return (
        <div className="lead-form-page-wrapper">
            {/* Header */}
            <div className="page-header-compact">
                <div className="header-left">
                    <button
                        className="btn-back"
                        onClick={() => navigate('/marketing/segments')}
                        title="Back to Segments"
                        type="button"
                    >
                        <FiArrowLeft size={20} style={{ strokeWidth: 2.5 }} />
                    </button>
                    <div className="header-title-section">
                        <h1 className="page-title-compact">
                            {id ? 'Edit Segment' : 'Create Segment'}
                        </h1>
                        <p className="page-subtitle-compact">
                            {id ? 'Update segment details' : 'Create a new audience segment'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form Content */}
            <div className="lead-form-content" style={{ maxWidth: '900px', margin: '0 auto' }}>
                <form className="lead-form" onSubmit={handleSubmit}>
                    {/* Basic Information */}
                    <div className="form-grid">
                        <div className="form-group full-width">
                            <label>Segment Name *</label>
                            <input
                                type="text"
                                className="form-input"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                required
                                placeholder="e.g., Hot Tech Leads"
                            />
                        </div>

                        <div className="form-group full-width">
                            <label>Description</label>
                            <textarea
                                className="form-textarea"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows="3"
                                placeholder="Describe this segment..."
                            />
                        </div>

                        <div className="form-group">
                            <label>Type *</label>
                            <select
                                className="form-select"
                                value={formData.type}
                                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                                disabled={!!id} // Can't change type when editing
                            >
                                <option value="dynamic">Dynamic (Rule-based)</option>
                                <option value="static">Static (Manual selection)</option>
                            </select>
                            <small className="form-hint">
                                {formData.type === 'dynamic'
                                    ? 'Automatically updates based on rules'
                                    : 'Manually select specific members'}
                            </small>
                        </div>

                        <div className="form-group">
                            <label>Owner *</label>
                            <select
                                className="form-select"
                                value={formData.owner}
                                onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                                required
                            >
                                <option value="">Select Owner</option>
                                {employees.map(emp => (
                                    <option key={emp._id} value={emp._id}>
                                        {emp.user?.name || emp.employeeId} - {emp.designation}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Dynamic Segment Rules */}
                    {formData.type === 'dynamic' && (
                        <>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                margin: '24px 0 16px',
                                paddingBottom: '8px',
                                borderBottom: '1px solid var(--border-color)'
                            }}>
                                Segment Rules
                            </h3>

                            <div className="rule-builder-section">
                                {formData.rules.length === 0 ? (
                                    <div className="empty-rules-state">
                                        <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '12px' }}>
                                            No rules added yet. Add rules to define your segment criteria.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="rules-list">
                                        {formData.rules.map((rule, index) => (
                                            <div key={index} className="rule-row">
                                                <div className="rule-row-content">
                                                    <div className="rule-field-group">
                                                        <label className="rule-label">Field</label>
                                                        <select
                                                            className="form-select rule-field-select"
                                                            value={rule.field}
                                                            onChange={(e) => updateRule(index, 'field', e.target.value)}
                                                        >
                                                            <option value="industry">Industry</option>
                                                            <option value="status">Status</option>
                                                            <option value="location">Location</option>
                                                            <option value="leadTemperature">Lead Temperature</option>
                                                            <option value="source">Source</option>
                                                            <option value="companySize">Company Size</option>
                                                            <option value="tags">Tags</option>
                                                            <option value="createdAt">Created Date</option>
                                                            <option value="value">Deal Value</option>
                                                        </select>
                                                    </div>

                                                    <div className="rule-field-group">
                                                        <label className="rule-label">Operator</label>
                                                        <select
                                                            className="form-select rule-operator-select"
                                                            value={rule.operator}
                                                            onChange={(e) => updateRule(index, 'operator', e.target.value)}
                                                        >
                                                            <option value="equals">Equals</option>
                                                            <option value="not_equals">Not Equals</option>
                                                            <option value="contains">Contains</option>
                                                            <option value="not_contains">Does Not Contain</option>
                                                            <option value="in">Is One Of</option>
                                                            <option value="not_in">Is Not One Of</option>
                                                            <option value="greater_than">Greater Than</option>
                                                            <option value="less_than">Less Than</option>
                                                            <option value="between">Between</option>
                                                        </select>
                                                    </div>

                                                    <div className="rule-field-group" style={{ flex: 2 }}>
                                                        <label className="rule-label">Value</label>
                                                        {renderValueInput(rule, index)}
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="btn-remove-rule"
                                                        onClick={() => removeRule(index)}
                                                        title="Remove rule"
                                                    >
                                                        <FiX size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                <button
                                    type="button"
                                    className="btn-add-rule"
                                    onClick={addRule}
                                >
                                    <FiPlus size={16} /> Add Rule
                                </button>
                            </div>
                        </>
                    )}

                    {/* Static Segment Member Selection */}
                    {formData.type === 'static' && (
                        <>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: '600',
                                margin: '24px 0 16px',
                                paddingBottom: '8px',
                                borderBottom: '1px solid var(--border-color)'
                            }}>
                                Select Members
                            </h3>

                            <div className="member-selector-section">
                                {/* Tabs */}
                                <div className="member-tabs">
                                    <button
                                        type="button"
                                        className={`member-tab-btn ${memberTab === 'leads' ? 'active' : ''}`}
                                        onClick={() => setMemberTab('leads')}
                                    >
                                        Leads ({formData.staticMembers.leads.length})
                                    </button>
                                    <button
                                        type="button"
                                        className={`member-tab-btn ${memberTab === 'contacts' ? 'active' : ''}`}
                                        onClick={() => setMemberTab('contacts')}
                                    >
                                        Contacts ({formData.staticMembers.contacts.length})
                                    </button>
                                </div>

                                {/* Search */}
                                <div className="member-search-bar">
                                    <FiSearch className="search-icon" />
                                    <input
                                        type="text"
                                        className="member-search-input"
                                        placeholder={`Search ${memberTab}...`}
                                        value={memberSearch}
                                        onChange={(e) => setMemberSearch(e.target.value)}
                                    />
                                </div>

                                {/* Member List */}
                                <div className="member-checkbox-list">
                                    {getFilteredMembers().length === 0 ? (
                                        <div className="empty-members-state">
                                            <p>No {memberTab} found</p>
                                        </div>
                                    ) : (
                                        getFilteredMembers().map(member => (
                                            <label key={member._id} className="member-checkbox-item">
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected(member._id)}
                                                    onChange={() => toggleMember(member._id)}
                                                />
                                                <div className="member-info">
                                                    <span className="member-name">{member.name}</span>
                                                    <span className="member-details">
                                                        {member.email && <span>{member.email}</span>}
                                                        {member.company && <span> • {member.company}</span>}
                                                    </span>
                                                </div>
                                            </label>
                                        ))
                                    )}
                                </div>

                                {/* Selected Count */}
                                <div className="selected-count-badge">
                                    Total Selected: <strong>{getSelectedCount()}</strong> members
                                </div>
                            </div>
                        </>
                    )}

                    {/* Form Actions */}
                    <div className="form-actions">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => navigate('/marketing/segments')}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            {loading ? 'Saving...' : id ? 'Update Segment' : 'Create Segment'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddSegment;
