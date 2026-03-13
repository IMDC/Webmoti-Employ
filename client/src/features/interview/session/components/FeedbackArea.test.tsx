import type { InterviewFeedback } from '../hooks/useInterviewFeedback'
import { render, screen } from '@test-utils'
import { FeedbackArea } from './FeedbackArea'

const baseFeedback: InterviewFeedback = {
  hint: [],
  showHint: false,
  showOffTopic: false,
  showFillerWarning: false,
  countupSeconds: 0,
  eyeContact: null,
}

describe('feedbackArea', () => {
  it('renders nothing when all feedback is inactive', () => {
    render(<FeedbackArea feedback={baseFeedback} />)

    expect(screen.queryByText('Eye Contact')).not.toBeInTheDocument()
    expect(screen.queryByText('Look at Interviewer')).not.toBeInTheDocument()
    expect(screen.queryByText('Off Topic')).not.toBeInTheDocument()
    expect(screen.queryByText('Reduce Filler Words')).not.toBeInTheDocument()
  })

  it('shows "Eye Contact" when eyeContact is good', () => {
    render(<FeedbackArea feedback={{ ...baseFeedback, eyeContact: 'good' }} />)

    expect(screen.getByText('Eye Contact')).toBeInTheDocument()
  })

  it('shows "Look at Interviewer" when eyeContact is bad', () => {
    render(<FeedbackArea feedback={{ ...baseFeedback, eyeContact: 'bad' }} />)

    expect(screen.getByText('Look at Interviewer')).toBeInTheDocument()
  })

  it('shows topic countup seconds', () => {
    render(<FeedbackArea feedback={{ ...baseFeedback, countupSeconds: 42 }} />)

    expect(screen.getByText('42s')).toBeInTheDocument()
  })

  it('shows hint text when active', () => {
    render(
      <FeedbackArea
        feedback={{
          ...baseFeedback,
          showHint: true,
          hint: ['Leadership', 'Teamwork'],
        }}
      />,
    )

    expect(screen.getByText('Leadership, Teamwork')).toBeInTheDocument()
  })

  it('shows "Off Topic" warning', () => {
    render(<FeedbackArea feedback={{ ...baseFeedback, showOffTopic: true }} />)

    expect(screen.getByText('Off Topic')).toBeInTheDocument()
  })

  it('shows "Reduce Filler Words" warning', () => {
    render(<FeedbackArea feedback={{ ...baseFeedback, showFillerWarning: true }} />)

    expect(screen.getByText('Reduce Filler Words')).toBeInTheDocument()
  })

  it('shows multiple feedback indicators simultaneously', () => {
    render(
      <FeedbackArea
        feedback={{
          ...baseFeedback,
          eyeContact: 'bad',
          showOffTopic: true,
          showFillerWarning: true,
          countupSeconds: 15,
        }}
      />,
    )

    expect(screen.getByText('Look at Interviewer')).toBeInTheDocument()
    expect(screen.getByText('Off Topic')).toBeInTheDocument()
    expect(screen.getByText('Reduce Filler Words')).toBeInTheDocument()
    expect(screen.getByText('15s')).toBeInTheDocument()
  })
})
