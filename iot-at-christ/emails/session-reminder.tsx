import {
  Html, Head, Body, Container, Section,
  Text, Heading, Button, Hr, Row, Column,
} from '@react-email/components'

interface Props {
  studentName:   string
  sessionTitle:  string
  unitTitle:     string
  topics:        string[]
  keywords:      string[]
  toolLink?:     string
  dashboardUrl:  string
}

export function SessionReminderEmail({
  studentName,
  sessionTitle,
  unitTitle,
  topics,
  keywords,
  dashboardUrl,
}: Props) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: '#F7F8FA', fontFamily: 'Georgia, serif' }}>
        <Container style={{ maxWidth: '580px', margin: '0 auto' }}>

          {/* Header */}
          <Section style={{ backgroundColor: '#1B2E4B', padding: '24px', textAlign: 'center' }}>
            <Text style={{ color: '#E8720C', fontSize: '11px', letterSpacing: '3px', margin: '0' }}>
              IoT AT CHRIST · CHRIST UNIVERSITY BENGALURU
            </Text>
            <Heading as="h1" style={{ color: '#ffffff', fontSize: '22px', margin: '8px 0 0' }}>
              Your session is tomorrow
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ padding: '32px 28px', backgroundColor: '#ffffff' }}>
            <Text style={{ fontSize: '16px', color: '#1B2E4B' }}>
              Hi {studentName?.split(' ')[0]},
            </Text>
            <Text style={{ color: '#555', lineHeight: '1.6' }}>
              <strong>{sessionTitle}</strong> is scheduled for tomorrow.
              Here's a quick recap of what to revisit before class.
            </Text>

            <Hr style={{ borderColor: '#E8720C', marginBottom: '16px' }} />

            <Heading as="h3" style={{ color: '#1B2E4B', fontSize: '14px' }}>
              {unitTitle} · Topics
            </Heading>
            {topics.slice(0, 4).map((t, i) => (
              <Text key={i} style={{ color: '#444', fontSize: '13px', margin: '4px 0' }}>
                ▸ {t}
              </Text>
            ))}

            <Heading as="h3" style={{ color: '#1B2E4B', fontSize: '14px', marginTop: '20px' }}>
              Keywords to Revise
            </Heading>
            <Text style={{ fontFamily: 'Courier New, monospace', fontSize: '12px', color: '#666' }}>
              {keywords.join(' · ')}
            </Text>
          </Section>

          {/* CTA */}
          <Section style={{ padding: '16px 28px 32px', backgroundColor: '#ffffff', textAlign: 'center' }}>
            <Button
              href={dashboardUrl}
              style={{
                backgroundColor: '#E8720C',
                color: '#ffffff',
                padding: '12px 28px',
                borderRadius: '6px',
                fontSize: '14px',
                fontFamily: 'Georgia, serif',
                textDecoration: 'none',
              }}
            >
              Open Dashboard →
            </Button>
          </Section>

          {/* Footer */}
          <Section style={{ padding: '16px 28px', textAlign: 'center' }}>
            <Text style={{ fontSize: '11px', color: '#aaa' }}>
              You're enrolled in IoT at CHRIST · {new Date().getFullYear()}
            </Text>
          </Section>

        </Container>
      </Body>
    </Html>
  )
}
