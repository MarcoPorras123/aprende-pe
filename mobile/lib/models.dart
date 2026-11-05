typedef Json = Map<String, dynamic>;

const domainLabels = {
  'idiomas': 'Idiomas',
  'preuni': 'Preuniversitario',
  'universitario': 'Universitario',
};
const modeLabels = {
  'diagnostico': 'Evaluarme',
  'practica': 'Practicar',
  'simulacro': 'Simulacro',
};

class StudyConfig {
  StudyConfig({
    this.domain = 'idiomas',
    this.subject = 'Francés',
    this.topic = 'General',
    this.mode = 'diagnostico',
    this.level = 'auto',
    this.source = 'demo',
    this.count = 6,
    this.threshold = 80,
    this.minutes = 10,
    this.format = 'choice',
  });
  String domain, subject, topic, mode, level, source, format;
  int count, threshold, minutes;
  factory StudyConfig.fromJson(Json j) => StudyConfig(
    domain: j['domain'],
    subject: j['subject'],
    topic: j['topic'],
    mode: j['mode'],
    level: j['level'] ?? 'auto',
    source: j['source'] ?? 'demo',
    count: j['count'],
    threshold: j['threshold'],
    minutes: j['minutes'],
    format: j['format'] ?? 'choice',
  );
  Json toJson() => {
    'domain': domain,
    'subject': subject,
    'topic': topic,
    'mode': mode,
    'level': level,
    'source': source,
    'count': count,
    'threshold': threshold,
    'minutes': minutes,
    'format': format,
    'target': 'general',
  };
  StudyConfig copy() => StudyConfig.fromJson(toJson());
}

class StudySession {
  StudySession(this.raw);
  final Json raw;
  String get id => raw['id'];
  StudyConfig get config => StudyConfig.fromJson(raw['config']);
  List<Json> get items => (raw['items'] as List).cast<Json>();
  List<Json> get answers => (raw['answers'] as List).cast<Json>();
  Json get feedbacks => raw['feedbacks'] ?? {};
  Json? get summary => raw['summary'];
  bool get completed => raw['completedAt'] != null;
  DateTime? get deadline => DateTime.tryParse(raw['deadlineAt'] ?? '');
}

String dateLabel(String? raw) {
  final d = DateTime.tryParse(raw ?? '')?.toLocal();
  if (d == null) return '';
  const months = [
    'ene',
    'feb',
    'mar',
    'abr',
    'may',
    'jun',
    'jul',
    'ago',
    'sep',
    'oct',
    'nov',
    'dic',
  ];
  return '${d.day} ${months[d.month - 1]} · ${d.hour.toString().padLeft(2, '0')}:${d.minute.toString().padLeft(2, '0')}';
}
