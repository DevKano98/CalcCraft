import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import Loader from '../ui/loader';
import Feedback from '../ui/feedback';

interface FeedbackData {
  name: string;
  email: string;
  message: string;
}

const FeedbackSection: React.FC = () => {
  const [formData, setFormData] = useState<FeedbackData>({
    name: '',
    email: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Add feedback to Firestore
      await addDoc(collection(db, 'feedback'), {
        ...formData,
        timestamp: new Date()
      });

      // Show success message
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);

      // Clear form
      setFormData({
        name: '',
        email: '',
        message: ''
      });

      // Refresh feedback list
      await loadFeedback();
    } catch (err) {
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const loadFeedback = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'feedback'));
      const feedbacks = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setFeedbackList(feedbacks);
    } catch (err) {
      setError('Failed to load feedback. Please try again.');
    }
  };

  React.useEffect(() => {
    loadFeedback();
  }, []);

  return (
    <div className="feedback-wrapper">
      <motion.div 
        className="feedback-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2>Share Your Feedback</h2>
        <form className="feedback-form" onSubmit={handleSubmit}>
          <div className="group">
            <label htmlFor="name">Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
            />
          </div>
          <div className="group">
            <label htmlFor="message">Message</label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleInputChange}
              required
            />
          </div>
          <button type="submit" className="btn" disabled={loading}>
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>
        </form>
        {showSuccess && <Feedback message="Feedback submitted successfully!" type="success" />}
        {error && <Feedback message={error} type="error" />}
      </motion.div>

      <motion.div 
        className="feedback-panel"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2>Recent Feedback</h2>
        {loading ? (
          <Loader />
        ) : (
          <ul className="feedback-list">
            {feedbackList.map((feedback) => (
              <li key={feedback.id} className="feedback-item">
                <strong>{feedback.name}</strong>
                <p>{feedback.message}</p>
              </li>
            ))}
          </ul>
        )}
      </motion.div>
    </div>
  );
};

export default FeedbackSection; 