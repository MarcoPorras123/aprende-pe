import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:aprende_pe_mobile/api.dart';
import 'package:aprende_pe_mobile/main.dart';
import 'package:aprende_pe_mobile/models.dart';
import 'package:aprende_pe_mobile/session.dart';
import 'package:aprende_pe_mobile/ui.dart';

const catalog = <String, dynamic>{
  'idiomas': {
    'subjects': ['Francés', 'Inglés'],
    'topics': {
      'Francés': ['General', 'Gramática'],
      'Inglés': ['General'],
    },
  },
  'preuni': {
    'subjects': ['General', 'Matemática'],
    'topics': {
      'General': ['General'],
      'Matemática': ['General', 'Ecuaciones'],
    },
  },
  'universitario': {
    'subjects': ['Cálculo'],
    'topics': {
      'Cálculo': ['General', 'Derivadas'],
    },
  },
};
const ai = <String, dynamic>{'ready': false, 'verified': false};

class FakeApi extends LearningApi {
  FakeApi({String mode = 'practica', bool expired = false})
    : super(browser: true, baseUrl: 'http://localhost') {
    s = StudySession({
      'id': 'test-session',
      'config': StudyConfig(mode: mode, count: 3).toJson(),
      'items': List.generate(
        3,
        (i) => {
          'id': 'q$i',
          'prompt': 'Pregunta ${i + 1}',
          'context': '',
          'type': 'choice',
          'options': [
            'Primera opción',
            'Segunda opción',
            'Tercera opción',
            'Cuarta opción',
          ],
          'skill': 'Gramática',
          'level': 'A1',
          'topic': 'Gramática',
          'subject': 'Francés',
          'explanation': 'Explicación del ejercicio',
          'concept': 'Concepto',
          'nextStep': 'Practica este tema',
          'correctIndex': 0,
        },
      ),
      'answers': <Json>[],
      'feedbacks': <String, dynamic>{},
      'completedAt': null,
      'summary': null,
      'deadlineAt': expired
          ? DateTime.now()
                .subtract(const Duration(seconds: 5))
                .toIso8601String()
          : null,
    });
  }
  late StudySession s;
  bool loseResponse = false;
  bool failRecovery = false;
  final receipts = <String>{};
  int submissions = 0;
  @override
  Future<void> initialize() async {}
  @override
  Future<Json> bootstrap() async => {
    'catalog': catalog,
    'ai': ai,
    'history': [],
    'active': null,
  };
  @override
  Future<StudySession> session(String id) async {
    if (failRecovery) throw const ApiException('Sin conexión');
    if (s.deadline != null && s.deadline!.isBefore(DateTime.now())) {
      complete('expired');
    }
    return s;
  }

  void complete(String reason) {
    final answers = s.answers;
    final outcomes = s.items.map((q) {
      final a = answers.where((a) => a['questionId'] == q['id']).firstOrNull;
      return {
        'question': q,
        'answer': a,
        'correct': a?['correct'] == true,
        'skipped': a == null || a['skipped'] == true,
      };
    }).toList();
    final correct = outcomes.where((o) => o['correct'] == true).length;
    s.raw['completedAt'] = DateTime.now().toIso8601String();
    s.raw['summary'] = {
      'correct': correct,
      'total': 3,
      'percentage': (correct / 3 * 100).round(),
      'answered': answers.length,
      'unanswered': 3 - answers.length,
      'targetMet': correct == 3,
      'reason': reason,
      'skills': {
        'Gramática': {'correct': correct, 'total': 3},
      },
      'levels': {
        'A1': {'correct': correct, 'total': 3},
      },
      'recommendation': 'Practica tus puntos débiles.',
      'levelMessage': 'No certifica un nivel global.',
      'outcomes': outcomes,
    };
  }

  @override
  Future<StudySession> answer(String id, Json body) async {
    submissions++;
    if (receipts.add(body['requestId'])) {
      s.raw['answers'].add({
        ...body,
        'correct': body['selectedIndex'] == 0,
        'skipped': body['skip'] == true,
      });
      s.raw['feedbacks'][body['questionId']] = {
        'correct': body['selectedIndex'] == 0,
        'correctIndex': 0,
        'answer': 'Primera opción',
        'explanation': 'Explicación del ejercicio',
        'concept': 'Concepto',
        'nextStep': 'Practica este tema',
      };
      if (s.answers.length == 3) complete('answered');
    }
    if (loseResponse) {
      loseResponse = false;
      throw const ApiException('Se perdió la respuesta');
    }
    return s;
  }
}

Future<void> smallPhone(WidgetTester tester) async {
  tester.view.physicalSize = const Size(390, 844);
  tester.view.devicePixelRatio = 1;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
}

Widget sessionApp(FakeApi api) => MaterialApp(
  theme: appTheme(),
  home: SessionScreen(api: api, session: api.s, catalog: catalog, ai: ai),
);
void main() {
  testWidgets('mobile home and guided configuration fit a 390px phone', (
    tester,
  ) async {
    await smallPhone(tester);
    final api = FakeApi();
    addTearDown(api.dispose);
    await tester.pumpWidget(AprendeApp(api: api));
    await tester.pumpAndSettle();
    expect(find.text('aprende pe!'), findsOneWidget);
    expect(tester.takeException(), isNull);
    await tester.tap(find.text('Conocer mi punto de partida'));
    await tester.pumpAndSettle();
    expect(find.text('¿Qué te gustaría lograr?'), findsOneWidget);
    await tester.tap(find.text('Continuar'));
    await tester.pumpAndSettle();
    expect(find.text('Vamos a enfocarnos.'), findsOneWidget);
    expect(tester.takeException(), isNull);
  });
  testWidgets(
    'practice gives immediate feedback and full result after three answers',
    (tester) async {
      await smallPhone(tester);
      final api = FakeApi();
      addTearDown(api.dispose);
      await tester.pumpWidget(sessionApp(api));
      await tester.pumpAndSettle();
      for (var i = 0; i < 3; i++) {
        await tester.tap(find.text('Primera opción').first);
        await tester.pump();
        await tester.tap(find.text('Comprobar respuesta'));
        await tester.pumpAndSettle();
        expect(find.text('¡Bien resuelto!'), findsOneWidget);
        expect(tester.takeException(), isNull);
        await tester.tap(
          find.text(i == 2 ? 'Ver mi resultado' : 'Siguiente pregunta'),
        );
        await tester.pumpAndSettle();
      }
      expect(find.text('100%'), findsOneWidget);
      expect(api.receipts.length, 3);
      expect(tester.takeException(), isNull);
    },
  );
  testWidgets(
    'lost answer response reconciles without submitting a duplicate',
    (tester) async {
      await smallPhone(tester);
      final api = FakeApi()..loseResponse = true;
      addTearDown(api.dispose);
      await tester.pumpWidget(sessionApp(api));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Primera opción').first);
      await tester.pump();
      await tester.tap(find.text('Comprobar respuesta'));
      await tester.pumpAndSettle();
      expect(find.text('¡Bien resuelto!'), findsOneWidget);
      expect(api.s.answers.length, 1);
      expect(api.submissions, 1);
    },
  );
  testWidgets('exam hides corrections until the result', (tester) async {
    await smallPhone(tester);
    final api = FakeApi(mode: 'diagnostico');
    addTearDown(api.dispose);
    await tester.pumpWidget(sessionApp(api));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Primera opción').first);
    await tester.pump();
    await tester.tap(find.text('Guardar respuesta'));
    await tester.pumpAndSettle();
    expect(find.text('Pregunta 2'), findsOneWidget);
    expect(find.text('Explicación del ejercicio'), findsNothing);
    expect(tester.takeException(), isNull);
  });
  testWidgets(
    'expired simulation retrieves server result without accepting answers',
    (tester) async {
      await smallPhone(tester);
      final api = FakeApi(mode: 'simulacro', expired: true);
      addTearDown(api.dispose);
      await tester.pumpWidget(sessionApp(api));
      await tester.pump(const Duration(seconds: 2));
      await tester.pumpAndSettle();
      expect(
        find.text('El simulacro terminó al agotarse el tiempo.'),
        findsOneWidget,
      );
      expect(api.submissions, 0);
    },
  );
}
