import '../../core/network/api_client.dart';
import '../models/invoice_model.dart';

class FinanceService {
  final ApiClient _client = ApiClient();

  Future<List<InvoiceModel>> getInvoices({String? status, String? search}) async {
    final query = <String, dynamic>{'limit': 50};
    if (status != null && status.isNotEmpty && status != 'all') {
      query['status'] = status;
    }
    if (search != null && search.isNotEmpty) {
      query['search'] = search;
    }

    try {
      final response = await _client.get('/finance/invoices', queryParams: query);
      if (response is Map) {
        final list = (response['data'] ?? response['items']) as List? ?? [];
        return list
            .whereType<Map<String, dynamic>>()
            .map((j) => InvoiceModel.fromJson(j))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  Future<InvoiceModel> getInvoice(String id) async {
    final response = await _client.get('/finance/invoices/$id');
    if (response is Map && (response['data'] != null || response['invoice'] != null)) {
      final invData = response['data'] ?? response['invoice'];
      return InvoiceModel.fromJson(Map<String, dynamic>.from(invData));
    }
    throw ApiException('Invoice not found');
  }

  Future<bool> updateStatus(String id, String status) async {
    final response = await _client.put('/finance/invoices/$id/status', body: {'status': status});
    return response is Map && response['success'] == true;
  }
}
