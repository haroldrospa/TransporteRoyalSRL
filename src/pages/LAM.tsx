
import Layout from '@/components/layout/Layout';
import LAMContent from '@/components/lam/LAMContent';
import { useAuth } from '@/contexts/AuthContext';

const LAM = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <LAMContent />
    </Layout>
  );
};

export default LAM;
