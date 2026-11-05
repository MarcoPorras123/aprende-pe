import 'dart:async';

import 'package:flutter/material.dart';

import 'api.dart';
import 'models.dart';
import 'result.dart';
import 'tutor.dart';
import 'ui.dart';

class SessionScreen extends StatefulWidget {
  const SessionScreen({
    super.key,
    required this.api,
    required this.session,
    required this.catalog,
    required this.ai,
  });
  final LearningApi api;
  final StudySession session;
  final Json catalog, ai;
  @override
  State<SessionScreen> createState() => _SessionScreenState();
}

class _SessionScreenState extends State<SessionScreen>
    with WidgetsBindingObserver {
  late StudySession s = widget.session;
  int? selected;
  String? error;
  bool busy = false, expiryChecked = false;
  Json? feedback;
  Json? feedbackQuestion;
  Json? pending;
  final input = TextEditingController(), scroll = ScrollController();
  Timer? timer;
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    timer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (!mounted) return;
      if (s.deadline != null && !s.completed) {
        setState(() {});
        if (seconds <= 0 && !busy && !expiryChecked) {
          expiryChecked = true;
          refresh();
        }
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    timer?.cancel();
    input.dispose();
    scroll.dispose();
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    if (state == AppLifecycleState.resumed && !busy) {
      expiryChecked = false;
      refresh();
    }
  }

  int get seconds =>
      s.deadline?.difference(widget.api.serverNow).inSeconds ?? 1;
  bool get expired => s.deadline != null && seconds <= 0;
  Json get question =>
      feedbackQuestion ??
      s.items[s.answers.length.clamp(0, s.items.length - 1)];
  void result() {
    if (!mounted) return;
    Navigator.of(context).pushReplacement(
      MaterialPageRoute(
        builder: (_) => ResultScreen(
          api: widget.api,
          session: s,
          catalog: widget.catalog,
          ai: widget.ai,
        ),
      ),
    );
  }

  void accept(StudySession updated, {Json? answered}) {
    s = updated;
    pending = null;
    error = null;
    selected = null;
    input.clear();
    if (answered != null &&
        s.config.mode == 'practica' &&
        s.feedbacks[answered['id']] != null) {
      feedback = s.feedbacks[answered['id']];
      feedbackQuestion = answered;
    } else if (s.completed) {
      result();
      return;
    }
    if (mounted) setState(() {});
    if (scroll.hasClients) scroll.jumpTo(0);
  }

  Future<void> refresh() async {
    if (busy) return;
    setState(() => busy = true);
    try {
      final updated = await widget.api.session(s.id);
      if (!mounted) return;
      if (updated.completed) {
        s = updated;
        result();
      } else if (updated.answers.length != s.answers.length) {
        accept(updated);
      } else {
        setState(() {
          s = updated;
          error = null;
        });
      }
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> answer({bool skip = false}) async {
    final q = question;
    pending ??= {
      'requestId': requestId(),
      'questionId': q['id'],
      if (skip) 'skip': true,
      if (!skip && q['type'] == 'choice') 'selectedIndex': selected,
      if (!skip && q['type'] != 'choice') 'input': input.text.trim(),
    };
    setState(() {
      busy = true;
      error = null;
    });
    try {
      final updated = await widget.api.answer(s.id, pending!);
      if (mounted) accept(updated, answered: q);
    } catch (e) {
      bool recovered = false;
      try {
        final updated = await widget.api.session(s.id);
        if (mounted &&
            (updated.completed ||
                updated.answers.any((a) => a['questionId'] == q['id']))) {
          accept(updated, answered: q);
          recovered = true;
        }
      } catch (_) {
        /* Retry retains the original answer and request id. */
      }
      if (!recovered && mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  Future<void> finish() async {
    final yes = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('¿Finalizar esta sesión?'),
        content: const Text(
          'Las preguntas sin responder contarán como pendientes en el resultado. También puedes volver atrás y continuar después.',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx, false),
            child: const Text('Seguir estudiando'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Finalizar'),
          ),
        ],
      ),
    );
    if (yes != true || !mounted) return;
    setState(() => busy = true);
    try {
      final updated = await widget.api.finish(s.id);
      if (mounted) {
        s = updated;
        result();
      }
    } catch (e) {
      if (mounted) setState(() => error = e.toString());
    } finally {
      if (mounted) setState(() => busy = false);
    }
  }

  void next() {
    if (s.completed) {
      result();
      return;
    }
    setState(() {
      feedback = null;
      feedbackQuestion = null;
    });
    scroll.jumpTo(0);
  }

  @override
  Widget build(BuildContext context) {
    final q = question;
    final index = s.items.indexWhere((i) => i['id'] == q['id']);
    final canAnswer =
        pending != null ||
        (q['type'] == 'choice'
            ? selected != null
            : input.text.trim().isNotEmpty);
    return PopScope(
      canPop: !busy,
      child: Scaffold(
        appBar: AppBar(
          title: Text(modeLabels[s.config.mode]!),
          actions: [
            if (s.deadline != null)
              Padding(
                padding: const EdgeInsets.only(right: 16),
                child: StudyBadge(
                  '${(seconds.clamp(0, 3600) ~/ 60).toString().padLeft(2, '0')}:${(seconds.clamp(0, 3600) % 60).toString().padLeft(2, '0')}',
                  icon: Icons.timer_outlined,
                  color: expired ? peach : sage,
                ),
              ),
          ],
        ),
        body: ListView(
          controller: scroll,
          padding: const EdgeInsets.fromLTRB(24, 8, 24, 24),
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    s.config.subject,
                    style: const TextStyle(
                      color: muted,
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                ),
                Text(
                  '${index + 1} / ${s.items.length}',
                  style: const TextStyle(
                    color: green,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            LinearProgressIndicator(
              value: s.answers.length / s.items.length,
              minHeight: 5,
              borderRadius: BorderRadius.circular(8),
              backgroundColor: const Color(0xffe1e8da),
            ),
            const SizedBox(height: 24),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                StudyBadge(
                  q['skill'] ?? s.config.topic,
                  color: domainColor(s.config.domain),
                  foreground: ink,
                ),
                if (q['level'] != null && q['level'] != '')
                  StudyBadge(q['level']),
                StudyBadge(
                  s.config.source == 'ai' ? 'Generada con IA' : 'Muestra',
                  color: Colors.white,
                  foreground: muted,
                ),
              ],
            ),
            const SizedBox(height: 22),
            if ((q['context'] ?? '').toString().isNotEmpty) ...[
              SheetCard(
                color: sage,
                child: Text(q['context'], style: const TextStyle(height: 1.7)),
              ),
              const SizedBox(height: 22),
            ],
            Text(
              q['prompt'],
              style: const TextStyle(
                fontSize: 23,
                fontWeight: FontWeight.w600,
                height: 1.4,
                letterSpacing: -.3,
              ),
            ),
            const SizedBox(height: 24),
            if (feedback == null && q['type'] == 'choice')
              for (final (i, option) in (q['options'] as List).indexed)
                Padding(
                  padding: const EdgeInsets.only(bottom: 12),
                  child: Semantics(
                    selected: selected == i,
                    button: true,
                    child: Material(
                      color: feedback != null && feedback!['correctIndex'] == i
                          ? sage
                          : selected == i
                          ? const Color(0xffedf3e7)
                          : Colors.white,
                      borderRadius: BorderRadius.circular(18),
                      child: InkWell(
                        borderRadius: BorderRadius.circular(18),
                        onTap:
                            busy ||
                                feedback != null ||
                                pending != null ||
                                expired
                            ? null
                            : () => setState(() => selected = i),
                        child: Container(
                          padding: const EdgeInsets.all(17),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(18),
                            border: Border.all(
                              color: selected == i
                                  ? green
                                  : const Color(0xffdee4da),
                              width: selected == i ? 1.5 : 1,
                            ),
                          ),
                          child: Row(
                            children: [
                              Container(
                                width: 30,
                                height: 30,
                                alignment: Alignment.center,
                                decoration: BoxDecoration(
                                  color: selected == i ? green : paper,
                                  borderRadius: BorderRadius.circular(9),
                                ),
                                child: Text(
                                  String.fromCharCode(65 + i),
                                  style: TextStyle(
                                    color: selected == i ? Colors.white : muted,
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                              ),
                              const SizedBox(width: 14),
                              Expanded(
                                child: Text(
                                  option.toString(),
                                  style: const TextStyle(fontSize: 15),
                                ),
                              ),
                              if (feedback != null &&
                                  feedback!['correctIndex'] == i)
                                const Icon(
                                  Icons.check_circle,
                                  color: green,
                                  size: 20,
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                )
            else if (feedback == null)
              TextField(
                controller: input,
                enabled:
                    !busy && feedback == null && pending == null && !expired,
                keyboardType: const TextInputType.numberWithOptions(
                  decimal: true,
                  signed: true,
                ),
                maxLength: 200,
                onChanged: (_) => setState(() {}),
                decoration: const InputDecoration(
                  labelText: 'Tu respuesta',
                  helperText:
                      'Escribe el número. Puedes usar coma o punto decimal.',
                ),
              ),
            if (feedback != null) ...[
              const SizedBox(height: 14),
              SheetCard(
                color: feedback!['correct'] == true ? sage : peach,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          feedback!['correct'] == true
                              ? Icons.check_circle_outline
                              : Icons.lightbulb_outline,
                          color: green,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            feedback!['correct'] == true
                                ? '¡Bien resuelto!'
                                : 'Veamos cómo resolverlo',
                            style: const TextStyle(
                              fontWeight: FontWeight.w700,
                              fontSize: 17,
                            ),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    Text(
                      'Respuesta: ${feedback!['answer']}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 10),
                    Text(feedback!['explanation']),
                    const SizedBox(height: 12),
                    Text(
                      'Idea clave: ${feedback!['concept']}',
                      style: const TextStyle(fontWeight: FontWeight.w600),
                    ),
                    const SizedBox(height: 10),
                    Text(feedback!['nextStep']),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              OutlinedButton.icon(
                onPressed: () => openScreen(
                  context,
                  TutorScreen(
                    api: widget.api,
                    sessionId: s.id,
                    question: q,
                    source: s.config.source,
                  ),
                ),
                icon: const Icon(Icons.chat_bubble_outline, size: 19),
                label: Text(
                  s.config.source == 'ai'
                      ? 'Preguntarle al tutor'
                      : 'Consultar la explicación',
                ),
              ),
            ],
            if (expired && !s.completed)
              const ErrorNote(
                'El tiempo terminó. Recupera el resultado para ver tus respuestas guardadas.',
              ),
            if (error != null) ErrorNote(error!, retry: refresh),
            const SizedBox(height: 16),
            Text(
              s.config.mode == 'simulacro'
                  ? 'El reloj sigue avanzando aunque cierres la app.'
                  : 'Las respuestas enviadas se guardan. Puedes volver atrás y continuar después.',
              style: const TextStyle(fontSize: 12, color: muted),
            ),
          ],
        ),
        bottomNavigationBar: SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(24, 12, 24, 12),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                PrimaryAction(
                  feedback != null
                      ? (s.completed
                            ? 'Ver mi resultado'
                            : 'Siguiente pregunta')
                      : expired
                      ? 'Recuperar resultado'
                      : pending != null
                      ? 'Reintentar envío'
                      : s.config.mode == 'practica'
                      ? 'Comprobar respuesta'
                      : index == s.items.length - 1
                      ? 'Enviar y ver resultado'
                      : 'Guardar respuesta',
                  busy: busy,
                  onPressed: feedback != null
                      ? next
                      : expired
                      ? refresh
                      : canAnswer
                      ? () => answer()
                      : null,
                ),
                if (feedback == null && !expired)
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Expanded(
                        child: TextButton(
                          onPressed: busy || pending != null
                              ? null
                              : () => answer(skip: true),
                          child: const Text(
                            'Omitir pregunta',
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                      Expanded(
                        child: TextButton(
                          onPressed: busy ? null : finish,
                          child: const Text(
                            'Finalizar',
                            textAlign: TextAlign.center,
                          ),
                        ),
                      ),
                    ],
                  ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
