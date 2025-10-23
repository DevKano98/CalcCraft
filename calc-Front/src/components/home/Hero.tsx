import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import workingVideo from '@/assets/team/videos/working.mp4';

export default function Hero() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gradient-to-b from-black to-purple-900 flex items-center">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
                            Welcome to{' '}
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                                CalcCraft
                            </span>
                        </h1>
                        <p className="text-xl text-gray-300 mb-8">
                            Experience the smartest scientific calculator that adapts to your needs.
                            Powered by cutting-edge technology to make complex calculations simple.
                        </p>

                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/calculator')}
                            className="px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-lg shadow-lg hover:shadow-purple-500/50 transition-shadow"
                        >
                            Get Started
                        </motion.button>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="relative"
                    >
                        {/* Video Section */}
                        <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-1">
                            <video
                                className="w-full rounded-xl"
                                autoPlay
                                loop
                                muted
                                playsInline
                                controls
                            >
                                <source src={workingVideo} type="video/mp4" />
                                Your browser does not support the video tag.
                            </video>
                        </div>

                        {/* Floating elements animation */}
                        <motion.div
                            animate={{
                                y: [0, -20, 0],
                            }}
                            transition={{
                                duration: 4,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute -top-8 right-12 w-20 h-20 bg-purple-500/20 rounded-full blur-xl"
                        />
                        <motion.div
                            animate={{
                                y: [0, 20, 0],
                            }}
                            transition={{
                                duration: 3,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                            className="absolute bottom-8 left-12 w-16 h-16 bg-pink-500/20 rounded-full blur-xl"
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
} 