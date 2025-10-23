import { motion } from 'framer-motion';
import { PencilIcon, CalculatorIcon, SparklesIcon } from '@heroicons/react/24/outline';

const features = [
    {
        title: 'Scientific Calculator',
        description: 'Advanced scientific calculator with support for complex mathematical operations.',
        icon: CalculatorIcon,
    },
    {
        title: 'Handwriting Recognition',
        description: 'Draw mathematical expressions and get instant results with our advanced recognition system.',
        icon: PencilIcon,
    },
    {
        title: 'Smart Features',
        description: 'Variable storage, history tracking, and seamless integration between typed and handwritten calculations.',
        icon: SparklesIcon,
    },
];

const Features = () => {
    return (
        <section className="py-24 px-4">
            <div className="max-w-7xl mx-auto">
                <motion.h2
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="text-3xl md:text-4xl font-bold text-center text-white mb-16"
                >
                    Powerful Features for Complex Calculations
                </motion.h2>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {features.map((feature, index) => (
                        <motion.div
                            key={feature.title}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: index * 0.2 }}
                            className="bg-black/30 backdrop-blur-sm rounded-2xl p-6 border border-white/10"
                        >
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                                <feature.icon className="w-6 h-6 text-white" />
                            </div>
                            <h3 className="text-xl font-semibold text-white mb-2">
                                {feature.title}
                            </h3>
                            <p className="text-gray-300">
                                {feature.description}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features; 