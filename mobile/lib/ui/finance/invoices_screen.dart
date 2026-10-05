import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/constants/app_colors.dart';
import '../../core/utils/formatters.dart';
import '../../core/utils/toast_util.dart';
import '../../data/models/invoice_model.dart';
import '../../providers/finance_provider.dart';
import '../widgets/empty_state.dart';
import '../widgets/status_badge.dart';

class InvoicesScreen extends StatefulWidget {
  const InvoicesScreen({super.key});

  @override
  State<InvoicesScreen> createState() => _InvoicesScreenState();
}

class _InvoicesScreenState extends State<InvoicesScreen> {
  final TextEditingController _searchController = TextEditingController();
  final List<String> _statuses = ['all', 'paid', 'pending', 'overdue'];
  String? _updatingInvoiceId;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<FinanceProvider>().fetchInvoices();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final finance = context.watch<FinanceProvider>();
    final invoices = finance.filteredInvoices;

    return Scaffold(
      backgroundColor: AppColors.backgroundLight,
      appBar: AppBar(
        title: const Text('Invoices & Finance'),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh_rounded),
            onPressed: () => context.read<FinanceProvider>().fetchInvoices(),
          ),
        ],
      ),
      body: Column(
        children: [
          // Top Summary Banner
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                gradient: AppColors.primaryGradient,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.primary.withValues(alpha: 0.2),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Total Collected',
                          style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          Formatters.formatCurrency(finance.totalRevenue),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    height: 36,
                    width: 1,
                    color: Colors.white24,
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'Balance Due',
                          style: TextStyle(color: Colors.white70, fontSize: 11, fontWeight: FontWeight.w500),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          Formatters.formatCurrency(finance.totalOutstanding),
                          style: const TextStyle(
                            color: Colors.white,
                            fontSize: 18,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          ),

          // Search & Filter
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: TextField(
              controller: _searchController,
              onChanged: (val) => finance.setSearchQuery(val),
              decoration: InputDecoration(
                hintText: 'Search by invoice # or client...',
                prefixIcon: const Icon(Icons.search_rounded, size: 20),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear_rounded, size: 18),
                        onPressed: () {
                          _searchController.clear();
                          finance.setSearchQuery('');
                        },
                      )
                    : null,
              ),
            ),
          ),

          // Horizontal Status Filter Chips
          SingleChildScrollView(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
            child: Row(
              children: _statuses.map((status) {
                final isSelected = finance.selectedStatus == status;
                final label = status[0].toUpperCase() + status.substring(1);

                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(label),
                    selected: isSelected,
                    onSelected: (_) {
                      finance.setFilterStatus(status);
                      finance.fetchInvoices();
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

          // Invoices List
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => finance.fetchInvoices(),
              color: AppColors.primary,
              child: finance.isLoading && invoices.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : invoices.isEmpty
                      ? const EmptyState(
                          icon: Icons.receipt_long_rounded,
                          title: 'No Invoices Found',
                          message: 'No invoices matching the current filter.',
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: invoices.length,
                          separatorBuilder: (context, index) => const SizedBox(height: 12),
                          itemBuilder: (context, index) {
                            final inv = invoices[index];
                            return _buildInvoiceCard(context, inv);
                          },
                        ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildInvoiceCard(BuildContext context, InvoiceModel inv) {
    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
        side: const BorderSide(color: AppColors.borderLight),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  inv.invoiceNumber,
                  style: const TextStyle(
                    fontWeight: FontWeight.bold,
                    fontSize: 15,
                    color: AppColors.textPrimary,
                  ),
                ),
                StatusBadge(status: inv.status),
              ],
            ),
            const SizedBox(height: 4),
            Text(
              inv.clientName,
              style: const TextStyle(
                fontSize: 13,
                fontWeight: FontWeight.w500,
                color: AppColors.textSecondary,
              ),
            ),
            const SizedBox(height: 12),
            const Divider(),
            const SizedBox(height: 8),

            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text('Due Date', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    Text(
                      Formatters.formatDate(inv.dueDate),
                      style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600),
                    ),
                  ],
                ),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    const Text('Total Amount', style: TextStyle(fontSize: 11, color: AppColors.textMuted)),
                    Text(
                      Formatters.formatCurrency(inv.total),
                      style: const TextStyle(
                        fontSize: 15,
                        fontWeight: FontWeight.bold,
                        color: AppColors.primary,
                      ),
                    ),
                  ],
                ),
              ],
            ),
            if (inv.status != 'paid') ...[
              const SizedBox(height: 12),
              Builder(
                builder: (btnCtx) {
                  final isUpdating = _updatingInvoiceId == inv.id;
                  return SizedBox(
                    width: double.infinity,
                    child: OutlinedButton.icon(
                      icon: isUpdating
                          ? const SizedBox(
                              width: 14,
                              height: 14,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Icon(Icons.check_rounded, size: 16),
                      label: Text(
                        isUpdating ? 'Updating...' : 'Mark as Paid',
                        style: const TextStyle(fontSize: 13),
                      ),
                      onPressed: isUpdating
                          ? null
                          : () async {
                              setState(() => _updatingInvoiceId = inv.id);
                              final finance = context.read<FinanceProvider>();
                              final ok = await finance.updateStatus(inv.id, 'paid');
                              if (mounted) {
                                setState(() => _updatingInvoiceId = null);
                                if (ok) {
                                  ToastUtil.showSuccess(null, 'Invoice ${inv.invoiceNumber} marked as paid');
                                } else {
                                  ToastUtil.showError(
                                    null,
                                    finance.errorMessage ?? 'Failed to update invoice status',
                                  );
                                }
                              }
                            },
                    ),
                  );
                },
              ),
            ],
          ],
        ),
      ),
    );
  }
}
