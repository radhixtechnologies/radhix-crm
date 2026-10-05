import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/toast_util.dart';
import '../../data/models/lead_model.dart';
import '../../providers/sales_provider.dart';
import '../widgets/custom_button.dart';
import '../widgets/status_badge.dart';

class LeadDetailScreen extends StatefulWidget {
  final LeadModel lead;

  const LeadDetailScreen({super.key, required this.lead});

  @override
  State<LeadDetailScreen> createState() => _LeadDetailScreenState();
}

class _LeadDetailScreenState extends State<LeadDetailScreen> {
  late LeadModel _lead;
  final TextEditingController _noteController = TextEditingController();
  bool _isAddingNote = false;
  bool _isUpdatingStatus = false;

  final List<String> _statuses = ['new', 'contacted', 'qualified', 'converted', 'lost'];

  @override
  void initState() {
    super.initState();
    _lead = widget.lead;
  }

  @override
  void dispose() {
    _noteController.dispose();
    super.dispose();
  }

  void _callPhone(String phone) async {
    if (phone.isEmpty) return;
    final uri = Uri.parse('tel:$phone');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _sendEmail(String email) async {
    if (email.isEmpty) return;
    final uri = Uri.parse('mailto:$email');
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri);
    }
  }

  void _changeStatus(String newStatus) async {
    if (_isUpdatingStatus) return;
    setState(() => _isUpdatingStatus = true);

    final sales = context.read<SalesProvider>();
    final ok = await sales.updateStatus(_lead.id, newStatus);
    if (mounted) {
      setState(() => _isUpdatingStatus = false);
      if (ok) {
        setState(() {
          _lead = LeadModel(
            id: _lead.id,
            name: _lead.name,
            email: _lead.email,
            phone: _lead.phone,
            company: _lead.company,
            source: _lead.source,
            status: newStatus,
            leadTemperature: _lead.leadTemperature,
            value: _lead.value,
            currency: _lead.currency,
            assignedToName: _lead.assignedToName,
            notes: _lead.notes,
            createdAt: _lead.createdAt,
          );
        });
        ToastUtil.showSuccess(context, 'Status updated to $newStatus');
      } else {
        ToastUtil.showError(
          context,
          sales.errorMessage ?? 'Failed to update status. Please check connection.',
        );
      }
    }
  }

  void _addNote() async {
    if (_isAddingNote) return;
    final content = _noteController.text.trim();
    if (content.isEmpty) return;

    setState(() => _isAddingNote = true);
    final sales = context.read<SalesProvider>();
    final ok = await sales.addLeadNote(_lead.id, content);
    if (mounted) {
      setState(() => _isAddingNote = false);
      if (ok) {
        _noteController.clear();
        Navigator.pop(context);
        ToastUtil.showSuccess(null, 'Note added');
        setState(() {
          _lead.notes.insert(
            0,
            LeadNote(content: content, addedBy: 'You', addedAt: DateTime.now()),
          );
        });
      } else {
        ToastUtil.showError(
          context,
          sales.errorMessage ?? 'Failed to add note. Please check connection.',
        );
      }
    }
  }

  void _showAddNoteDialog() {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(ctx).viewInsets.bottom + 16,
          left: 16,
          right: 16,
          top: 20,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              'Add Lead Note',
              style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: _noteController,
              maxLines: 4,
              decoration: const InputDecoration(
                hintText: 'Enter discussion notes, followup details...',
              ),
            ),
            const SizedBox(height: 16),
            CustomButton(
              text: 'Save Note',
              isLoading: _isAddingNote,
              onPressed: _addNote,
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Lead Details'),
        actions: [
          PopupMenuButton<String>(
            tooltip: 'Change Status',
            icon: const Icon(Icons.swap_horiz_rounded),
            onSelected: _changeStatus,
            itemBuilder: (ctx) => _statuses.map((s) {
              return PopupMenuItem(
                value: s,
                child: Row(
                  children: [
                    StatusBadge(status: s),
                  ],
                ),
              );
            }).toList(),
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Top Profile Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 28,
                        backgroundColor: AppColors.primary.withValues(alpha: 0.12),
                        child: Text(
                          _lead.name.isNotEmpty ? _lead.name[0].toUpperCase() : 'L',
                          style: const TextStyle(
                            fontSize: 24,
                            fontWeight: FontWeight.bold,
                            color: AppColors.primary,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _lead.name,
                              style: const TextStyle(
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                                color: AppColors.textPrimary,
                              ),
                            ),
                            if (_lead.company.isNotEmpty) ...[
                              const SizedBox(height: 2),
                              Text(
                                _lead.company,
                                style: const TextStyle(
                                  fontSize: 14,
                                  color: AppColors.textSecondary,
                                ),
                              ),
                            ],
                            const SizedBox(height: 6),
                            Row(
                              children: [
                                StatusBadge(status: _lead.status),
                                const SizedBox(width: 6),
                                StatusBadge(
                                  status: _lead.leadTemperature,
                                  fontSize: 10,
                                ),
                              ],
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 20),
                  const Divider(),
                  const SizedBox(height: 12),

                  // Call & Email Actions
                  Row(
                    children: [
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _lead.phone.isNotEmpty ? () => _callPhone(_lead.phone) : null,
                          icon: const Icon(Icons.phone_rounded, size: 18),
                          label: const Text('Call'),
                        ),
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: OutlinedButton.icon(
                          onPressed: _lead.email.isNotEmpty ? () => _sendEmail(_lead.email) : null,
                          icon: const Icon(Icons.email_rounded, size: 18),
                          label: const Text('Email'),
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Lead Information Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(18),
                border: Border.all(color: AppColors.borderLight),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Lead Information',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                      color: AppColors.textPrimary,
                    ),
                  ),
                  const SizedBox(height: 16),
                  _buildInfoRow(Icons.phone_outlined, 'Phone', _lead.phone.isNotEmpty ? _lead.phone : 'Not provided'),
                  _buildInfoRow(Icons.email_outlined, 'Email', _lead.email.isNotEmpty ? _lead.email : 'Not provided'),
                  _buildInfoRow(Icons.currency_rupee_rounded, 'Estimated Value', Formatters.formatCurrency(_lead.value, _lead.currency)),
                  _buildInfoRow(Icons.source_outlined, 'Source', _lead.source.toUpperCase()),
                  if (_lead.assignedToName != null)
                    _buildInfoRow(Icons.person_outline_rounded, 'Assigned Rep', _lead.assignedToName!),
                  if (_lead.createdAt != null)
                    _buildInfoRow(Icons.calendar_today_outlined, 'Created Date', Formatters.formatDate(_lead.createdAt)),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Notes Section
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  'Notes & Activity',
                  style: TextStyle(
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                    color: AppColors.textPrimary,
                  ),
                ),
                TextButton.icon(
                  onPressed: _showAddNoteDialog,
                  icon: const Icon(Icons.add_rounded, size: 18),
                  label: const Text('Add Note'),
                ),
              ],
            ),
            const SizedBox(height: 8),

            if (_lead.notes.isEmpty)
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.borderLight),
                ),
                child: const Center(
                  child: Text(
                    'No notes yet. Tap "Add Note" to log a conversation.',
                    style: TextStyle(fontSize: 13, color: AppColors.textSecondary),
                  ),
                ),
              )
            else
              ListView.separated(
                shrinkWrap: true,
                physics: const NeverScrollableScrollPhysics(),
                itemCount: _lead.notes.length,
                separatorBuilder: (context, index) => const SizedBox(height: 8),
                itemBuilder: (context, index) {
                  final note = _lead.notes[index];
                  return Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.borderLight),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              note.addedBy ?? 'System',
                              style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                            ),
                            if (note.addedAt != null)
                              Text(
                                Formatters.formatDate(note.addedAt),
                                style: const TextStyle(fontSize: 11, color: AppColors.textMuted),
                              ),
                          ],
                        ),
                        const SizedBox(height: 6),
                        Text(
                          note.content,
                          style: const TextStyle(fontSize: 13, color: AppColors.textPrimary),
                        ),
                      ],
                    ),
                  );
                },
              ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: AppColors.textSecondary),
          const SizedBox(width: 12),
          SizedBox(
            width: 110,
            child: Text(
              label,
              style: const TextStyle(fontSize: 13, color: AppColors.textSecondary),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w600,
                color: AppColors.textPrimary,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
