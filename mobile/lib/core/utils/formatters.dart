import 'package:intl/intl.dart';

class Formatters {
  static final DateFormat _dateFormat = DateFormat('dd MMM yyyy');
  static final DateFormat _dateTimeFormat = DateFormat('dd MMM yyyy, hh:mm a');
  static final DateFormat _timeFormat = DateFormat('hh:mm a');
  static final NumberFormat _currencyFormat = NumberFormat.currency(
    locale: 'en_IN',
    symbol: '₹',
    decimalDigits: 0,
  );

  static String formatDate(dynamic date) {
    if (date == null) return '-';
    try {
      DateTime dt = date is DateTime ? date : DateTime.parse(date.toString());
      return _dateFormat.format(dt.toLocal());
    } catch (_) {
      return date.toString();
    }
  }

  static String formatDateTime(dynamic date) {
    if (date == null) return '-';
    try {
      DateTime dt = date is DateTime ? date : DateTime.parse(date.toString());
      return _dateTimeFormat.format(dt.toLocal());
    } catch (_) {
      return date.toString();
    }
  }

  static String formatTime(dynamic date) {
    if (date == null) return '--:--';
    try {
      DateTime dt = date is DateTime ? date : DateTime.parse(date.toString());
      return _timeFormat.format(dt.toLocal());
    } catch (_) {
      return date.toString();
    }
  }

  static String formatCurrency(num? amount, [String currency = 'INR']) {
    if (amount == null) return '₹0';
    if (currency == 'USD') {
      return NumberFormat.currency(locale: 'en_US', symbol: '\$', decimalDigits: 0).format(amount);
    }
    return _currencyFormat.format(amount);
  }

  static String timeAgo(dynamic date) {
    if (date == null) return '';
    try {
      DateTime dt = date is DateTime ? date : DateTime.parse(date.toString());
      final diff = DateTime.now().difference(dt);
      if (diff.inSeconds < 60) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      if (diff.inDays < 7) return '${diff.inDays}d ago';
      return formatDate(dt);
    } catch (_) {
      return '';
    }
  }
}
