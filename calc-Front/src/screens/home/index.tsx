import Hero from '@/components/home/Hero';
import Teams from '@/components/home/Teams';
import Features from '@/components/home/Features';
import Footer from '@/components/layout/Footer';
import { Link } from 'react-router-dom';

export default function Home() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-purple-900">
            <Hero />
            <Features />
            <Teams />
            <div className="py-12 px-4">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-bold text-white mb-4">Have Feedback?</h2>
                    <p className="text-gray-300 mb-8">
                        We'd love to hear your thoughts about our calculator app!
                    </p>
                    <Link 
                        to="/feedback" 
                        className="inline-block bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
                    >
                        Share Your Feedback
                    </Link>
                </div>
            </div>
            <Footer />
        </div>
    );
}
