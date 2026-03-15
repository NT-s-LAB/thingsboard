/// API Endpoints for EITEK Platform
class ApiEndpoints {
  ApiEndpoints._();

  // Auth
  static const String login = '/auth/login';
  static const String register = '/auth/register';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String profile = '/auth/profile';
  static const String changePassword = '/auth/change-password';

  // Users
  static const String users = '/users';
  static String user(String id) => '/users/$id';

  // Tenants
  static const String tenants = '/tenants';
  static String tenant(String id) => '/tenants/$id';

  // Projects
  static const String projects = '/projects';
  static String project(String id) => '/projects/$id';
  static String projectSites(String projectId) => '/projects/$projectId/sites';

  // Sites
  static const String sites = '/sites';
  static String site(String id) => '/sites/$id';
  static String siteAreas(String siteId) => '/sites/$siteId/areas';

  // Areas
  static const String areas = '/areas';
  static String area(String id) => '/areas/$id';
  static String areaDevices(String areaId) => '/areas/$areaId/devices';

  // Devices
  static const String devices = '/devices';
  static String device(String id) => '/devices/$id';
  static String deviceTelemetry(String id) => '/devices/$id/telemetry';
  static String deviceAttributes(String id) => '/devices/$id/attributes';
  static String deviceRpc(String id) => '/devices/$id/rpc';

  // Device Templates
  static const String deviceTemplates = '/device-templates';
  static String deviceTemplate(String id) => '/device-templates/$id';

  // SCADA Views
  static const String scadaViews = '/scada-views';
  static String scadaView(String id) => '/scada-views/$id';

  // Widgets
  static const String widgets = '/widgets';
  static String widget(String id) => '/widgets/$id';
  static const String widgetCategories = '/widget-categories';

  // Symbols
  static const String symbols = '/symbols';
  static String symbol(String id) => '/symbols/$id';

  // Realtime
  static const String realtimeSubscribe = '/realtime/subscribe';
  static const String realtimeUnsubscribe = '/realtime/unsubscribe';

  // ThingsBoard Integration
  static const String tbDevices = '/thingsboard/devices';
  static const String tbTelemetry = '/thingsboard/telemetry';
}
