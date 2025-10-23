import React from 'react';
import { motion } from 'framer-motion';
import { database } from '../../lib/firebase';
import { ref, push, onValue, DataSnapshot } from 'firebase/database';
import './feedback.css';
import Loader from './loader';

interface FeedbackData {
  name: string;
  feedback: string;
}

const Feedback: React.FC = () => {
  const [data, setData] = React.useState<FeedbackData>({
    name: "",
    feedback: "",
  });
  const [feedbackArray, setFeedbackArray] = React.useState<FeedbackData[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [submitting, setSubmitting] = React.useState<boolean>(false);
  const [showSuccess, setShowSuccess] = React.useState<boolean>(false);
  const [error, setError] = React.useState<string>("");

  React.useEffect(() => {
    setLoading(true);
    onValue(ref(database, `feedbacks`), (snapshot: DataSnapshot) => {
      if (snapshot.exists()) {
        const a: FeedbackData[] = [];
        const data = snapshot.val();
        for (const i in data) {
          for (const j in data[i]) {
            a.push(data[i][j]);
          }
        }
        setFeedbackArray(a.reverse());
      } else {
        setFeedbackArray([]);
      }
      setLoading(false);
    });
  }, []);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setData({ ...data, [name]: value });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    
    try {
      if (data.name === "" || data.feedback === "") {
        setError("Please fill in all fields");
        return;
      }
      const now = new Date();
      const formattedTimestamp = now.toLocaleString("en-GB").replace(",", "");
      const nodeName = formattedTimestamp.replace(/\//g, "-");
      await push(ref(database, `feedbacks/${nodeName}`), data);
      setData({ name: "", feedback: "" });
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit feedback. Please try again.";
      setError(errorMessage);
      console.error("Feedback submission error:", err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="feedback-wrapper">
      <motion.div 
        className="feedback-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Share Your Feedback</h2>
        <form onSubmit={handleSubmit} className="feedback-form">
          <div className="group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              name="name"
              required
              onChange={handleChange}
              value={data.name}
              placeholder="Enter your name"
              className="input-field"
            />
          </div>
          <div className="group">
            <label htmlFor="feedback">Feedback</label>
            <textarea
              id="feedback"
              name="feedback"
              required
              onChange={handleChange}
              value={data.feedback}
              placeholder="Share your thoughts..."
              className="input-field"
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          {showSuccess && (
            <motion.p 
              className="success-message"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              Thank you for your feedback!
            </motion.p>
          )}
          <motion.button 
            type="submit" 
            className="submit-btn"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Feedback'}
          </motion.button>
        </form>
      </motion.div>
      <motion.div 
        className="feedback-panel"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <h2 className="text-2xl font-bold text-white mb-6">Recent Feedback</h2>
        {loading ? (
          <div className="loading-container">
            <Loader />
          </div>
        ) : (
          <ul className="feedback-list">
            {feedbackArray.length > 0 ? (
              feedbackArray.map((obj, index) => (
                <motion.li 
                  key={index} 
                  className="feedback-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className="feedback-header">
                    <strong>{obj.name}</strong>
                    <span className="timestamp">{new Date().toLocaleDateString()}</span>
                  </div>
                  <p>{obj.feedback}</p>
                </motion.li>
              ))
            ) : (
              <p className="no-feedback">No feedback yet. Be the first to share!</p>
            )}
          </ul>
        )}
      </motion.div>
    </div>
  );
};

export default Feedback;
