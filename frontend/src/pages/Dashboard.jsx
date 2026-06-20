import TrainSearch from '../components/TrainSearch';
import MyBookings from '../components/MyBookings';
import './Dashboard.css';

const Dashboard = () => {
  return (
    <div className="dashboard-container">
      <TrainSearch />
      
      <div className="dashboard-divider"></div>
      
      <MyBookings />
    </div>
  );
};

export default Dashboard;
