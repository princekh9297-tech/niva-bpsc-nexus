export const SAMPLE_QUESTIONS = [
  {
    id:"polity-001",
    subject:"Polity",
    topic:"Fundamental Rights",
    q:"Which Article of the Constitution is known as the Right to Constitutional Remedies?",
    options:["Article 14","Article 19","Article 32","Article 44"],
    answer:2,
    explanation:"Article 32 empowers citizens to move the Supreme Court for enforcement of Fundamental Rights. Dr. B. R. Ambedkar called it the Constitution's 'heart and soul'."
  },
  {
    id:"history-001",
    subject:"Modern History",
    topic:"Freedom Movement",
    q:"The Champaran Satyagraha of 1917 was primarily associated with which issue?",
    options:["Indigo cultivation","Salt tax","Forest rights","Textile workers"],
    answer:0,
    explanation:"Champaran Satyagraha was connected with the grievances of indigo cultivators, particularly the tinkathia system."
  }
];

export function getQuestion(subject=null) {
  const pool = subject ? SAMPLE_QUESTIONS.filter(x=>x.subject.toLowerCase()===subject.toLowerCase()) : SAMPLE_QUESTIONS;
  return pool[Math.floor(Math.random()*pool.length)] || SAMPLE_QUESTIONS[0];
}
