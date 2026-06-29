
import Layout from '@/components/layout/Layout';
import FersuazContent from '@/components/fersuaz/FersuazContent';
import { useAuth } from '@/contexts/AuthContext';

const Fersuaz = () => {
  const { user } = useAuth();

  return (
    <Layout>
      <FersuazContent />
    </Layout>
  );
};

export default Fersuaz;
