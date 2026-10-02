import React from 'react';
import { PhysicsPills } from './PhysicsPills';

export const HeroBanner: React.FC = () => {
  return (
    <section className="banner-main" id="home">
      <PhysicsPills />
      <div className="container">
        <h1 className="banner-title">
          PRINCE
          <span>PRINCE</span>
          <span>PRINCE</span>
          <span>YOUR TECH PARTNER</span>
        </h1>
      </div>
    </section>
  );
};

export default HeroBanner;
