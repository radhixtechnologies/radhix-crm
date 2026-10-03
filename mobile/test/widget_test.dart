import 'package:flutter_test/flutter_test.dart';
import 'package:radhix_crm/main.dart';

void main() {
  testWidgets('RadhixCrmApp smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const RadhixCrmApp());
    expect(find.byType(RadhixCrmApp), findsOneWidget);
  });
}
