import { motion } from 'framer-motion';
import me from '@/assets/team/photos/me.jpg';
import khachu from '@/assets/team/photos/khachu.jpg';
import mane from '@/assets/team/photos/mane.jpg';
import hule from '@/assets/team/photos/hule.jpg';

// Team member data - Update these values to change team information
const teamMembers = [
    {
        name: "Dev Birendra Kanojiya",  // Change this to your name
        role: "Project Head", // Change this to your role
        image: me,
        description: "Passionate about creating beautiful and functional user interfaces Doinf Backend Stuff and using Different technologies.", // Add your description
        social: {
            github: "https://github.com/yourusername", // Add your GitHub
            linkedin: "https://linkedin.com/in/dev-kanojiya" // Add your LinkedIn
        }
    },
    {
        name: "Sohan Dhananjay Khachane",  // Change team member name
        role: "UI/UX Designer", // Change role
        image: khachu,
        description: "Designing intuitive and engaging user experiences.", // Add description
        social: {
            linkedin: "https://linkedin.com/in/khachu"
        }
    },
    {
        name: "Chinmay Shekhar Mane",  // Change team member name
        role: "Backend Developer", // Change role
        image: mane,
        description: "Building robust and scalable backend systems using python nodejs Expressjs and python flask.", // Add description
        social: {
            linkedin: "https://linkedin.com/in/mane"
        }
    },
    {
        name: "Harsh Shailendra Hule",  // Change team member name
        role: "ML Engineer", // Change role
        image: hule,
        description: "Implementing cutting-edge machine learning solutions using ai apis in the project.", // Add description
        social: {
            linkedin: "https://linkedin.com/in/hule"
        }
    }
];

export default function Teams() {
    return (
        <section className="py-24 bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    viewport={{ once: true }}
                    className="text-center mb-16"
                >
                    <h2 className="text-4xl font-bold text-white mb-4">
                        Meet Our{' '}
                        <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
                            Team
                        </span>
                    </h2>
                    <p className="text-xl text-gray-400 max-w-2xl mx-auto">
                        A passionate team of developers and designers working together to create the next generation of scientific calculators.
                    </p>
                </motion.div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {teamMembers.map((member, index) => (
                        <motion.div
                            key={member.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: index * 0.1 }}
                            viewport={{ once: true }}
                            className="group"
                        >
                            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 p-1">
                                <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
                                <div className="relative space-y-4">
                                    <div className="aspect-square overflow-hidden rounded-xl">
                                        <img
                                            src={member.image}
                                            alt={member.name}
                                            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-300"
                                        />
                                    </div>
                                    <div className="p-4">
                                        <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                                        <p className="text-purple-400">{member.role}</p>
                                        <p className="text-sm text-gray-400 mt-2">{member.description}</p>
                                        <div className="flex space-x-4 mt-4">
                                            <a 
                                                href={member.social.github} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-white transition-colors"
                                            >
                                                GitHub
                                            </a>
                                            <a 
                                                href={member.social.linkedin} 
                                                target="_blank" 
                                                rel="noopener noreferrer"
                                                className="text-gray-400 hover:text-white transition-colors"
                                            >
                                                LinkedIn
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
} 