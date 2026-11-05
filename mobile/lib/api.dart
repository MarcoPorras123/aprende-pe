import 'dart:async';
import 'dart:convert';
import 'dart:math';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import 'models.dart';

class ApiException implements Exception {
  const ApiException(this.message, [this.status = 0]);
  final String message;
  final int status;
  @override
  String toString() => message;
}

abstract class LocalSecrets {
  Future<String?> read(String key);
  Future<void> write(String key, String value);
}

class SecureSecrets implements LocalSecrets {
  final _storage = const FlutterSecureStorage();
  @override
  Future<String?> read(String key) => _storage.read(key: key);
  @override
  Future<void> write(String key, String value) =>
      _storage.write(key: key, value: value);
}

String requestId() => List.generate(
  16,
  (_) => Random.secure().nextInt(256).toRadixString(16).padLeft(2, '0'),
).join();

class LearningApi {
  LearningApi({
    http.Client? client,
    LocalSecrets? storage,
    bool? browser,
    String? baseUrl,
  }) : _client = client ?? http.Client(),
       _storage = storage ?? SecureSecrets(),
       browser = browser ?? kIsWeb,
       baseUrl =
           baseUrl ??
           (kIsWeb
               ? Uri.base.origin
               : const String.fromEnvironment('API_BASE_URL'));
  final http.Client _client;
  final LocalSecrets _storage;
  final bool browser;
  String baseUrl;
  String? _cookie;
  Duration clockOffset = Duration.zero;
  DateTime get serverNow => DateTime.now().add(clockOffset);

  static String validateUrl(String input, {bool requireHttps = kReleaseMode}) {
    final u = Uri.tryParse(input.trim());
    if (u == null ||
        !['http', 'https'].contains(u.scheme) ||
        u.host.isEmpty ||
        u.userInfo.isNotEmpty ||
        u.hasQuery ||
        u.hasFragment ||
        (u.path.isNotEmpty && u.path != '/')) {
      throw const ApiException(
        'Escribe la dirección del servidor, por ejemplo https://api.tudominio.pe, sin rutas ni credenciales.',
      );
    }
    if (requireHttps && u.scheme != 'https') {
      throw const ApiException(
        'La versión de distribución requiere un servidor HTTPS.',
      );
    }
    return u.origin;
  }

  Future<void> initialize() async {
    if (browser) return;
    baseUrl = await _storage.read('api_origin') ?? baseUrl;
    if (baseUrl.isNotEmpty) {
      baseUrl = validateUrl(baseUrl);
      _cookie = await _storage.read('guest:$baseUrl');
    }
  }

  Future<void> configure(String url) async {
    if (browser) {
      throw const ApiException('La vista previa utiliza su propio servidor.');
    }
    final normalized = validateUrl(url);
    await _storage.write('api_origin', normalized);
    baseUrl = normalized;
    _cookie = await _storage.read('guest:$baseUrl');
    clockOffset = Duration.zero;
  }

  Future<Json> call(String path, [Json? body]) async {
    if (baseUrl.isEmpty) {
      throw const ApiException('Configura el servidor para comenzar.');
    }
    final req = http.Request(
      body == null ? 'GET' : 'POST',
      Uri.parse('$baseUrl/api/v3$path'),
    );
    req.followRedirects = false;
    req.headers['Accept'] = 'application/json';
    if (!browser && _cookie != null) req.headers['Cookie'] = _cookie!;
    if (body != null) {
      req.headers['Content-Type'] = 'application/json';
      req.body = jsonEncode(body);
    }
    http.Response response;
    try {
      response = await http.Response.fromStream(
        await _client.send(req).timeout(const Duration(seconds: 100)),
      ).timeout(const Duration(seconds: 100));
    } catch (_) {
      throw const ApiException(
        'No pudimos conectar con el servidor. Revisa tu conexión y vuelve a intentar; tus respuestas guardadas se conservan.',
      );
    }
    Json data;
    try {
      data = jsonDecode(utf8.decode(response.bodyBytes)) as Json;
    } catch (_) {
      throw const ApiException(
        'El servidor no devolvió una respuesta válida. Comprueba su dirección.',
      );
    }
    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw ApiException(
        data['error'] is String
            ? data['error']
            : 'No se pudo completar la solicitud.',
        response.statusCode,
      );
    }
    if (!browser) {
      final match = RegExp(r'aprende_pe_guest=([a-f0-9]{64})(?:;|$)')
          .firstMatch(response.headers['set-cookie'] ?? '');
      if (match != null) {
        final cookie = 'aprende_pe_guest=${match[1]}';
        try {
          await _storage.write('guest:$baseUrl', cookie);
        } catch (_) {
          throw const ApiException(
            'No pudimos guardar tu perfil en el almacenamiento seguro del teléfono. Inténtalo de nuevo.',
          );
        }
        _cookie = cookie;
      }
    }
    final now = DateTime.tryParse(data['serverNow'] ?? '');
    if (now != null) clockOffset = now.difference(DateTime.now());
    return data;
  }

  Future<Json> bootstrap() => call('/bootstrap');
  Future<StudySession> create(StudyConfig config, String key) async =>
      StudySession(
        (await call('/sessions', {
          'config': config.toJson(),
          'requestId': key,
        }))['session'],
      );
  Future<StudySession> session(String id) async =>
      StudySession((await call('/sessions/$id'))['session']);
  Future<StudySession> answer(String id, Json body) async =>
      StudySession((await call('/sessions/$id/answers', body))['session']);
  Future<StudySession> finish(String id) async =>
      StudySession((await call('/sessions/$id/finish', {}))['session']);
  Future<Json> tutor(String id, String q, String message) =>
      call('/sessions/$id/tutor', {'questionId': q, 'message': message});
  void dispose() => _client.close();
}
