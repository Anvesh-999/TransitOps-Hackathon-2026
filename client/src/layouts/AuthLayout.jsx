import { Outlet } from 'react-router-dom';

const AuthLayout = () => {
  return (
    <div className="min-h-screen w-full mesh-glow-bg bg-slate-950 flex items-center justify-center p-4">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
