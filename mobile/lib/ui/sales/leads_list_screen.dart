import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../data/models/lead_model.dart';
import '../../providers/sales_provider.dart';
import '../widgets/empty_state.dart';
import '../widgets/status_badge.dart';
import 'add_lead_screen.dart';
import 'lead_detail_screen.dart';

class LeadsListScreen extends StatefulWidget {
  const LeadsListScreen({super.key});

  @override
  State<LeadsListScreen> createState() => _LeadsListScreenState();
}

class _LeadsListScreenState extends State<LeadsListScreen> {
  final TextEditingController _searchController = TextEditingController();

  final List<String> _statuses = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost'];

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<SalesProvider>().fetchLeads();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
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

  @override
  Widget build(BuildContext context) {
    final sales = context.watch<SalesProvider>();
    final leads = sales.filteredLeads;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Sales & Leads'),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => const AddLeadScreen()),
          );
        },
        child: const Icon(Icons.add_rounded),
      ),
      body: Column(
        children: [
          // Search Bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: TextField(
              controller: _searchController,
              onChanged: (val) {
                sales.setSearchQuery(val);
              },
              decoration: InputDecoration(
                hintText: 'Search leads by name, company, phone...',
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          sales.setSearchQuery('');
                        },
                      )
                    : null,
              ),
            ),
          ),

          // Horizontal Status Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: _statuses.map((status) {
                final isSelected = sales.selectedStatus == status;
                final label = status[0].toUpperCase() + status.substring(1);

                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(label),
                    selected: isSelected,
                    onSelected: (_) {
                      sales.setFilterStatus(status);
                      sales.fetchLeads();
                    },
                    selectedColor: AppColors.primary.withValues(alpha: 0.15),
                    checkmarkColor: AppColors.primary,
                    labelStyle: TextStyle(
                      color: isSelected ? AppColors.primary : AppColors.textSecondary,
                      fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                      fontSize: 13,
                    ),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(20),
                      side: BorderSide(
                        color: isSelected ? AppColors.primary : AppColors.borderLight,
                      ),
                    ),
                  ),
                );
              }).toList(),
            ),
          ),
          const SizedBox(height: 8),

          // Leads List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => sales.fetchLeads(),
              color: AppColors.primary,
              child: sales.isLoading && leads.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : leads.isEmpty
                      ? EmptyState(
                          icon: Icons.person_search_rounded,
                          title: 'No Leads Found',
                          message: sales.searchQuery.isNotEmpty
                              ? 'No results matched your search query.'
                              : 'No leads available for this status filter.',
                          actionText: 'Refresh',
                          onAction: () => sales.fetchLeads(),
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          itemCount: leads.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final lead = leads[index];
                            return _buildLeadCard(context, lead);
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildLeadCard(BuildContext context, LeadModel lead) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.borderLight),
      ),
      child: InkWell(
        borderRadius: BorderRadius.circular(16),
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(builder: (_) => LeadDetailScreen(lead: lead)),
          );
        },
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header Row: Name & Status
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: AppColors.primary.withValues(alpha: 0.1),
                    child: Text(
                      lead.name.isNotEmpty ? lead.name[0].toUpperCase() : 'L',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                        fontSize: 16,
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          lead.name,
                          style: const TextStyle(
                            fontSize: 15,
                            fontWeight: FontWeight.bold,
                            color: AppColors.textPrimary,
                          ),
                        ),
                        if (lead.company.isNotEmpty) ...[
                          const SizedBox(height: 2),
                          Text(
                            lead.company,
                            style: const TextStyle(
                              fontSize: 13,
                              color: AppColors.textSecondary,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      StatusBadge(status: lead.status),
                      if (lead.leadTemperature.isNotEmpty) ...[
                        const SizedBox(height: 4),
                        StatusBadge(
                          status: lead.leadTemperature,
                          fontSize: 10,
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 8),

              // Bottom Details & Quick Actions Row
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'Deal Value',
                        style: TextStyle(fontSize: 11, color: AppColors.textMuted),
                      ),
                      Text(
                        Formatters.formatCurrency(lead.value, lead.currency),
                        style: const TextStyle(
                          fontSize: 15,
                          fontWeight: FontWeight.bold,
                          color: AppColors.textPrimary,
                        ),
                      ),
                    ],
                  ),
                  Row(
                    children: [
                      if (lead.phone.isNotEmpty)
                        IconButton.filledTonal(
                          iconSize: 18,
                          style: IconButton.styleFrom(
                            backgroundColor: AppColors.success.withValues(alpha: 0.12),
                            foregroundColor: AppColors.success,
                          ),
                          icon: const Icon(Icons.phone_rounded),
                          onPressed: () => _callPhone(lead.phone),
                        ),
                      if (lead.email.isNotEmpty) ...[
                        const SizedBox(width: 8),
                        IconButton.filledTonal(
                          iconSize: 18,
                          style: IconButton.styleFrom(
                            backgroundColor: AppColors.info.withValues(alpha: 0.12),
                            foregroundColor: AppColors.info,
                          ),
                          icon: const Icon(Icons.email_rounded),
                          onPressed: () => _sendEmail(lead.email),
                        ),
                      ],
                    ],
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
