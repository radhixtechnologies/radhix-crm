import '../../core/network/api_client.dart';
import '../models/task_model.dart';

class TaskService {
  final ApiClient _client = ApiClient();

  Future<List<TaskModel>> getTasks() async {
    try {
      final response = await _client.get('/employees/tasks');
      if (response is Map) {
        final list = (response['data'] ?? response['items']) as List? ?? [];
        return list
            .whereType<Map<String, dynamic>>()
            .map((j) => TaskModel.fromJson(j))
            .toList();
      }
    } catch (_) {}
    return [];
  }

  Future<TaskModel> createTask(Map<String, dynamic> data) async {
    final response = await _client.post('/employees/tasks', body: data);
    if (response is Map && (response['success'] == true || response['data'] != null)) {
      final tData = response['data'] ?? response;
      return TaskModel.fromJson(Map<String, dynamic>.from(tData));
    }
    throw ApiException('Failed to create task');
  }

  Future<bool> updateTaskStatus(String id, String status) async {
    final response = await _client.put('/employees/tasks/$id', body: {'status': status});
    return response is Map && response['success'] == true;
  }

  Future<bool> submitTaskForApproval(String id) async {
    final response = await _client.post('/employees/tasks/$id/submit');
    return response is Map && response['success'] == true;
  }
}
