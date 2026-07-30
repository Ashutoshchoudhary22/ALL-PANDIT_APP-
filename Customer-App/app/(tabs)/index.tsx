import { OnboardingCarousel } from '@/components/OnboardingSlide';
import { router } from 'expo-router';

const SLIDES = [
  {
    id: '1',
    title: 'Discover Divine Wisdom\nwith My-Pandit',
    subtitle:
      'Connect with trusted pandits for personalized rituals, astrology & spiritual guidance.',
    logoText: 'ॐ',
  },
  {
    id: '2',
    title: 'Book Pandits\nAnytime, Anywhere',
    subtitle:
      'Find verified pandits near you and book pujas, havans & ceremonies in just a few taps.',
    logoText: '🙏',
  },
  {
    id: '3',
    title: 'Astrology &\nKundli Insights',
    subtitle:
      'Get accurate kundli reading, horoscope and muhurat suggestions from expert astrologers.',
    logoText: '✦',
  },
  {
    id: '4',
    title: 'Live Puja &\nVirtual Darshan',
    subtitle:
      'Join live rituals online and receive blessings from sacred temples across India.',
    logoText: '🪔',
  },
  {
    id: '5',
    title: 'Your Spiritual\nJourney Starts Here',
    subtitle:
      'Create your profile and let My-Pandit guide every sacred moment of your life.',
    logoText: '✨',
  },
];

export default function HomeScreen() {
  return (
    <OnboardingCarousel
      slides={SLIDES}
      buttonText="Get Started"
      lastButtonText="Get Started"
      onFinish={() => router.push('/sign-in')}
    />
  );
}
