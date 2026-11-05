import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:http/http.dart' as http;
import 'package:http/testing.dart';
import 'package:aprende_pe_mobile/api.dart';

class MemorySecrets implements LocalSecrets {
  final values = <String, String>{};
  @override
  Future<String?> read(String key) async => values[key];
  @override
  Future<void> write(String key, String value) async {
    values[key] = value;
  }
}

void main() {
  test(
    'native guest is stored, restored after restart and isolated by server',
    () async {
      final storage = MemorySecrets();
      final token = List.filled(64, 'a').join();
      final cookies = <String?>[];
      http.Client client() => MockClient((r) async {
        cookies.add(r.headers['cookie']);
        expect(r.followRedirects, false);
        return http.Response(
          jsonEncode({'serverNow': DateTime.now().toIso8601String()}),
          200,
          headers: {'set-cookie': 'aprende_pe_guest=$token; HttpOnly; Path=/'},
        );
      });
      final first = LearningApi(
        client: client(),
        storage: storage,
        browser: false,
        baseUrl: 'https://one.test',
      );
      await first.initialize();
      await first.bootstrap();
      first.dispose();
      final second = LearningApi(
        client: client(),
        storage: storage,
        browser: false,
        baseUrl: 'https://one.test',
      );
      await second.initialize();
      await second.bootstrap();
      expect(cookies, [null, 'aprende_pe_guest=$token']);
      await second.configure('https://two.test');
      await second.bootstrap();
      expect(cookies.last, isNull);
      second.dispose();
    },
  );
  test('browser leaves the HttpOnly cookie to the browser', () async {
    final storage = MemorySecrets();
    final api = LearningApi(
      browser: true,
      baseUrl: 'http://localhost:4175',
      storage: storage,
      client: MockClient((r) async {
        expect(r.headers.containsKey('cookie'), false);
        return http.Response(
          '{}',
          200,
          headers: {
            'set-cookie':
                'aprende_pe_guest=${List.filled(64, 'a').join()}; HttpOnly',
          },
        );
      }),
    );
    await api.initialize();
    await api.bootstrap();
    expect(storage.values, isEmpty);
    api.dispose();
  });
  test(
    'production requires HTTPS and refuses credentials, queries and paths',
    () {
      for (final url in [
        'http://api.test',
        'https://user:secret@api.test',
        'https://api.test/api',
        'https://api.test?key=abc',
        'file:///tmp',
      ]) {
        expect(
          () => LearningApi.validateUrl(url, requireHttps: true),
          throwsA(isA<ApiException>()),
        );
      }
      expect(
        LearningApi.validateUrl('https://api.test/', requireHttps: true),
        'https://api.test',
      );
    },
  );
  test(
    'quota errors propagate without inventing generated questions',
    () async {
      final api = LearningApi(
        browser: true,
        baseUrl: 'https://api.test',
        client: MockClient(
          (_) async => http.Response(
            jsonEncode({'error': 'La cuenta necesita créditos.'}),
            503,
            headers: {'content-type': 'application/json; charset=utf-8'},
          ),
        ),
      );
      await expectLater(
        api.bootstrap(),
        throwsA(
          isA<ApiException>()
              .having((e) => e.status, 'status', 503)
              .having(
                (e) => e.message,
                'message',
                'La cuenta necesita créditos.',
              ),
        ),
      );
      api.dispose();
    },
  );
  test('invalid response is recoverable and server clock is used', () async {
    final future = DateTime.now().add(const Duration(minutes: 12));
    final api = LearningApi(
      browser: true,
      baseUrl: 'https://api.test',
      client: MockClient(
        (_) async => http.Response(
          jsonEncode({'serverNow': future.toIso8601String()}),
          200,
        ),
      ),
    );
    await api.bootstrap();
    expect(api.serverNow.difference(future).inSeconds.abs(), lessThan(2));
    api.dispose();
    final bad = LearningApi(
      browser: true,
      baseUrl: 'https://api.test',
      client: MockClient((_) async => http.Response('<html>error</html>', 502)),
    );
    await expectLater(bad.bootstrap(), throwsA(isA<ApiException>()));
    bad.dispose();
  });
}
