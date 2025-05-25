import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

const FAQS = [
  {
    question: "What is StartupTalent?",
    answer: "StartupTalent is a platform that connects innovative entrepreneurs with potential sponsors and mentors. We help startups showcase their ideas, get funding, and receive valuable feedback from industry experts."
  },
  {
    question: "How can I share my startup idea?",
    answer: "To share your startup idea, simply sign up as an entrepreneur, navigate to your dashboard, and click on 'Share Your Idea'. You can then provide details about your startup, including description, industry focus, and social links."
  },
  {
    question: "Is my startup idea protected?",
    answer: "We take intellectual property seriously. While ideas are publicly visible, you control what information you share. We recommend sharing enough to attract interest while protecting sensitive details. Our platform also includes measures to track and manage who views your ideas."
  },
  {
    question: "How does the sponsorship process work?",
    answer: "Sponsors can browse through startup ideas and initiate contact through our platform. Once there's mutual interest, you can share more details, discuss terms, and formalize the sponsorship through our structured process that protects both parties."
  },
  {
    question: "What types of startups can join?",
    answer: "We welcome startups from all industries, whether you're in technology, healthcare, education, or any other sector. Your idea should be innovative, scalable, and have a clear value proposition."
  },
  {
    question: "How can sponsors get involved?",
    answer: "Sponsors can register on our platform, browse through curated startup ideas, and connect with entrepreneurs. We offer various sponsorship opportunities, from direct funding to mentorship and resource sharing."
  },
  {
    question: "What makes StartupTalent different?",
    answer: "We focus on creating meaningful connections between startups and sponsors. Our platform offers structured processes, detailed profiles, and tools for collaboration. We also provide resources for growth and a community of like-minded entrepreneurs."
  },
  {
    question: "Is there a cost to join?",
    answer: "No is free for both entrepreneurs and sponsors.But we have premium features and additional services that may have associated costs in the future."
  }
];

export default function FAQSection() {
  return (
    <section className="py-20 bg-muted/10">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex items-center justify-center mb-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <HelpCircle className="h-8 w-8 text-primary" />
              </div>
            </div>
            <h2 className="text-4xl font-bold mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-muted-foreground">
              Everything you need to know about StartupTalent. Can't find the answer you're looking for?{' '}
              <a href="/contact" className="text-primary hover:underline">
                Contact our support team
              </a>
            </p>
          </div>

          <div className="bg-card rounded-xl shadow-sm border">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className={`px-6 ${index === FAQS.length - 1 ? '' : 'border-b'}`}
                >
                  <AccordionTrigger className="py-6 text-left hover:no-underline">
                    <div className="flex items-start">
                      <span className="text-lg font-semibold">{faq.question}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-6">
                    <div className="text-muted-foreground text-base leading-relaxed">
                      {faq.answer}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-12 text-center">
            <p className="text-muted-foreground">
              Still have questions?{' '}
              <a href="/faq" className="text-primary hover:underline font-medium">
                View all FAQs
              </a>
              {' '}or{' '}
              <a href="/contact" className="text-primary hover:underline font-medium">
                get in touch
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 