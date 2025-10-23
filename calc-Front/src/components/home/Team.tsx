import { motion } from 'framer-motion';

const team = [
  {
    name: 'Alex Chen',
    role: 'Frontend Developer',
    image: '/team/developer-1.png',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Sarah Johnson',
    role: 'Backend Developer',
    image: '/team/developer-2.png',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Michael Lee',
    role: 'UI/UX Designer',
    image: '/team/developer-3.png',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
  {
    name: 'Emily Zhang',
    role: 'Firebase Integrator',
    image: '/team/developer-4.png',
    github: 'https://github.com',
    linkedin: 'https://linkedin.com',
  },
];

const Team = () => {
  return (
    <div className="py-24 bg-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Meet the{' '}
            <span className="bg-gradient-to-r from-purple-500 to-pink-500 bg-clip-text text-transparent">
              GeegyNerds
            </span>
          </h2>
          <p className="text-gray-400 text-lg">
            The brilliant minds behind CalcCraft
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member, index) => (
            <motion.div
              key={member.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group relative"
            >
              <div className="relative aspect-square overflow-hidden rounded-2xl bg-purple-900/20 backdrop-blur-sm">
                <img
                  src={member.image}
                  alt={member.name}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="flex justify-center space-x-4">
                      <a
                        href={member.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-purple-500 transition-colors"
                      >
                        GitHub
                      </a>
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-white hover:text-purple-500 transition-colors"
                      >
                        LinkedIn
                      </a>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-xl font-semibold text-white">{member.name}</h3>
                <p className="text-gray-400">{member.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Team; 