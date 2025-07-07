// Original invalid code: 
- const initialLayout = await getRandomBackground();

// Replaced with valid async pattern: 
import { getRandomBackground } from '...';

React.useEffect(() => {
  const loadLayout = async () => {
    const background = await getRandomBackground('/fallback.jpg');
    setBackground(background);
  };

  loadLayout();
}, []);