import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Footer() {
    return (
        <footer className="bg-gradient-to-b from-gray-900 to-gray-800 text-gray-300 border-t border-gray-700">
            <div className="max-w-7xl mx-auto px-4 py-12">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Brand Section */}
                    <div className="space-y-4">
                        <Link to="/" className="inline-block">
                            <motion.h2 
                                className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-500 to-red-500"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.2 }}
                            >
                                Smart Calculator
                            </motion.h2>
                        </Link>
                        <p className="text-gray-400 text-sm max-w-xs">
                            Your intelligent companion for mathematical calculations and problem-solving.
                        </p>
                    </div>

                    {/* Navigation Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Quick Links</h3>
                        <nav className="flex flex-col space-y-2">
                            <Link 
                                to="/calculator" 
                                className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center"
                            >
                                <span className="w-1.5 h-1.5 bg-purple-500 rounded-full mr-2"></span>
                                Calculator
                            </Link>
                            <Link 
                                to="/canvas" 
                                className="text-gray-400 hover:text-white transition-colors duration-200 flex items-center"
                            >
                                <span className="w-1.5 h-1.5 bg-pink-500 rounded-full mr-2"></span>
                                Canvas
                            </Link>
                        </nav>
                    </div>

                    {/* Contact/Info Section */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-semibold text-white">Contact</h3>
                        <div className="space-y-2 text-sm text-gray-400">
                            <p>Email: support@smartcalculator.com</p>
                            <p>Phone: +1 (555) 123-4567</p>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-gray-700">
                    <div className="flex flex-col md:flex-row justify-between items-center">
                        <p className="text-sm text-gray-400 mb-4 md:mb-0">
                            © {new Date().getFullYear()} Smart Calculator. All rights reserved.
                        </p>
                        <div className="flex space-x-6">
                            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                                Terms of Service
                            </a>
                            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200">
                                Privacy Policy
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
} 