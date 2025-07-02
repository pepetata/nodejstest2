import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/Auth.scss';

function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Step 1: Account Information
    ownerName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',

    // Step 2: Restaurant Details
    restaurantName: '',
    businessType: 'single', // single or multi-location
    cuisineType: '',
    website: '',
    description: '',

    // Step 3: Location & Hours
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
    },
    operatingHours: {
      monday: { open: '09:00', close: '22:00', closed: false },
      tuesday: { open: '09:00', close: '22:00', closed: false },
      wednesday: { open: '09:00', close: '22:00', closed: false },
      thursday: { open: '09:00', close: '22:00', closed: false },
      friday: { open: '09:00', close: '22:00', closed: false },
      saturday: { open: '09:00', close: '22:00', closed: false },
      sunday: { open: '09:00', close: '22:00', closed: false },
    },

    // Step 4: Features & Plan Selection
    selectedFeatures: ['digital_menu'], // Core feature always included
    subscriptionPlan: 'starter',

    // Step 5: Payment & Billing
    paymentInfo: {
      cardNumber: '',
      expiryDate: '',
      cvv: '',
      cardholderName: '',
    },
    billingAddress: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      sameAsRestaurant: true,
    },
    marketingConsent: false,
  });
  const [error, setError] = useState('');

  const cuisineTypes = [
    'American',
    'Italian',
    'Mexican',
    'Chinese',
    'Japanese',
    'Thai',
    'Indian',
    'French',
    'Mediterranean',
    'Greek',
    'Korean',
    'Vietnamese',
    'Pizza',
    'Burgers',
    'Seafood',
    'Steakhouse',
    'Vegetarian',
    'Vegan',
    'Fast Food',
    'Cafe',
    'Bakery',
    'Bar & Grill',
    'Other',
  ];

  const features = [
    {
      id: 'digital_menu',
      name: 'Digital Menu & QR Ordering',
      required: true,
      description: 'Essential baseline feature',
    },
    {
      id: 'waiter_portal',
      name: 'Waiter Portal',
      description: 'Staff ordering interface',
    },
    {
      id: 'seat_ordering',
      name: 'Seat-Based Ordering',
      description: 'Per-seat item tagging',
    },
    {
      id: 'payment_integration',
      name: 'Payment Integration',
      description: 'In-app payment processing',
    },
    {
      id: 'kitchen_printer',
      name: 'Kitchen Printer Integration',
      description: 'Direct printer connectivity',
    },
    {
      id: 'loyalty_program',
      name: 'Customer Loyalty Program',
      description: 'Points and rewards system',
    },
    {
      id: 'analytics',
      name: 'Advanced Analytics',
      description: 'Detailed reporting and insights',
    },
  ];

  const subscriptionPlans = {
    starter: {
      name: 'Starter Plan',
      price: 29,
      description: 'Basic features for single locations',
    },
    professional: {
      name: 'Professional Plan',
      price: 79,
      description: 'Enhanced features for busy restaurants',
    },
    enterprise: {
      name: 'Enterprise Plan',
      price: 149,
      description: 'Complete solution for restaurant chains',
    },
  };

  // Calculate recommended plan based on features and business type
  const getRecommendedPlan = () => {
    const featureCount = formData.selectedFeatures.length;
    const isMultiLocation = formData.businessType === 'multi';

    if (isMultiLocation || featureCount >= 6) return 'enterprise';
    if (featureCount >= 4) return 'professional';
    return 'starter';
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value,
      }));
    }
  };

  const handleOperatingHoursChange = (day, field, value) => {
    setFormData((prev) => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value,
        },
      },
    }));
  };

  const handleFeatureToggle = (featureId) => {
    if (featureId === 'digital_menu') return; // Can't uncheck required feature

    setFormData((prev) => {
      const newFeatures = prev.selectedFeatures.includes(featureId)
        ? prev.selectedFeatures.filter((f) => f !== featureId)
        : [...prev.selectedFeatures, featureId];

      return {
        ...prev,
        selectedFeatures: newFeatures,
        subscriptionPlan: getRecommendedPlan(),
      };
    });
  };

  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.ownerName || !formData.email || !formData.password || !formData.phone) {
          setError('All fields are required');
          return false;
        }
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          return false;
        }
        if (formData.password.length < 8) {
          setError('Password must be at least 8 characters long');
          return false;
        }
        break;
      case 2:
        if (!formData.restaurantName || !formData.cuisineType) {
          setError('Restaurant name and cuisine type are required');
          return false;
        }
        break;
      case 3:
        if (
          !formData.address.street ||
          !formData.address.city ||
          !formData.address.state ||
          !formData.address.zipCode
        ) {
          setError('Complete address is required');
          return false;
        }
        break;
      case 4:
        // Features validation is handled automatically
        break;
      case 5:
        if (
          !formData.paymentInfo.cardNumber ||
          !formData.paymentInfo.expiryDate ||
          !formData.paymentInfo.cvv ||
          !formData.paymentInfo.cardholderName
        ) {
          setError('Complete payment information is required');
          return false;
        }
        if (
          !formData.billingAddress.sameAsRestaurant &&
          (!formData.billingAddress.street ||
            !formData.billingAddress.city ||
            !formData.billingAddress.state ||
            !formData.billingAddress.zipCode)
        ) {
          setError('Complete billing address is required');
          return false;
        }
        break;
      default:
        break;
    }
    setError('');
    return true;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateStep(5)) return;

    try {
      // Call the register function from AuthContext with restaurant data
      await register({
        type: 'restaurant',
        ...formData,
        subscriptionPlan: getRecommendedPlan(),
      });
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Registration failed. Please try again.');
    }
  };

  const renderProgressBar = () => (
    <div className="progress-container mb-4">
      <div className="progress-bar">
        {[1, 2, 3, 4, 5].map((step) => (
          <div key={step} className={`progress-step ${currentStep >= step ? 'active' : ''}`}>
            <div className="step-number">{step}</div>
            <div className="step-label">
              {step === 1 && 'Account'}
              {step === 2 && 'Restaurant'}
              {step === 3 && 'Location'}
              {step === 4 && 'Features'}
              {step === 5 && 'Payment'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep1 = () => (
    <div>
      <h3 className="step-title">Account Information</h3>
      <p className="step-description">Let&apos;s start with your personal information</p>

      <div className="form-group">
        <label htmlFor="ownerName" className="form-label">
          Full Name *
        </label>
        <input
          type="text"
          id="ownerName"
          name="ownerName"
          value={formData.ownerName}
          onChange={handleChange}
          className="form-input"
          placeholder="Enter your full name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="email" className="form-label">
          Email Address *
        </label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="form-input"
          placeholder="Enter your email"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="phone" className="form-label">
          Phone Number *
        </label>
        <input
          type="tel"
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          className="form-input"
          placeholder="Enter your phone number"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">
          Password *
        </label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          className="form-input"
          placeholder="Enter your password"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword" className="form-label">
          Confirm Password *
        </label>
        <input
          type="password"
          id="confirmPassword"
          name="confirmPassword"
          value={formData.confirmPassword}
          onChange={handleChange}
          className="form-input"
          placeholder="Confirm your password"
          required
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div>
      <h3 className="step-title">Restaurant Details</h3>
      <p className="step-description">Tell us about your restaurant</p>

      <div className="form-group">
        <label htmlFor="restaurantName" className="form-label">
          Restaurant Name *
        </label>
        <input
          type="text"
          id="restaurantName"
          name="restaurantName"
          value={formData.restaurantName}
          onChange={handleChange}
          className="form-input"
          placeholder="Enter your restaurant name"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="businessType" className="form-label">
          Business Type *
        </label>
        <select
          id="businessType"
          name="businessType"
          value={formData.businessType}
          onChange={handleChange}
          className="form-input"
          required
        >
          <option value="single">Single Location</option>
          <option value="multi">Multi-Location Chain</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="cuisineType" className="form-label">
          Cuisine Type *
        </label>
        <select
          id="cuisineType"
          name="cuisineType"
          value={formData.cuisineType}
          onChange={handleChange}
          className="form-input"
          required
        >
          <option value="">Select cuisine type</option>
          {cuisineTypes.map((cuisine) => (
            <option key={cuisine} value={cuisine}>
              {cuisine}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="website" className="form-label">
          Website (Optional)
        </label>
        <input
          type="url"
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
          className="form-input"
          placeholder="https://www.yourrestaurant.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="description" className="form-label">
          Restaurant Description
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-input"
          placeholder="Brief description of your restaurant (helps with SEO and customer discovery)"
          rows="3"
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div>
      <h3 className="step-title">Location & Hours</h3>
      <p className="step-description">Where are you located and when are you open?</p>

      <div className="form-group">
        <label htmlFor="address.street" className="form-label">
          Street Address *
        </label>
        <input
          type="text"
          id="address.street"
          name="address.street"
          value={formData.address.street}
          onChange={handleChange}
          className="form-input"
          placeholder="123 Main Street"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="address.city" className="form-label">
            City *
          </label>
          <input
            type="text"
            id="address.city"
            name="address.city"
            value={formData.address.city}
            onChange={handleChange}
            className="form-input"
            placeholder="City"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="address.state" className="form-label">
            State *
          </label>
          <input
            type="text"
            id="address.state"
            name="address.state"
            value={formData.address.state}
            onChange={handleChange}
            className="form-input"
            placeholder="State"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="address.zipCode" className="form-label">
            ZIP Code *
          </label>
          <input
            type="text"
            id="address.zipCode"
            name="address.zipCode"
            value={formData.address.zipCode}
            onChange={handleChange}
            className="form-input"
            placeholder="12345"
            required
          />
        </div>
      </div>

      <div className="operating-hours">
        <h4 className="form-label">Operating Hours</h4>
        {Object.keys(formData.operatingHours).map((day) => (
          <div key={day} className="hours-row">
            <div className="day-label">{day.charAt(0).toUpperCase() + day.slice(1)}</div>
            <div className="hours-inputs">
              <input
                type="checkbox"
                id={`${day}-closed`}
                checked={formData.operatingHours[day].closed}
                onChange={(e) => handleOperatingHoursChange(day, 'closed', e.target.checked)}
              />
              <label htmlFor={`${day}-closed`}>Closed</label>
              {!formData.operatingHours[day].closed && (
                <>
                  <input
                    type="time"
                    value={formData.operatingHours[day].open}
                    onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                    className="form-input time-input"
                  />
                  <span>to</span>
                  <input
                    type="time"
                    value={formData.operatingHours[day].close}
                    onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                    className="form-input time-input"
                  />
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div>
      <h3 className="step-title">Features & Plan Selection</h3>
      <p className="step-description">Choose the features you need</p>

      <div className="features-grid">
        {features.map((feature) => (
          <div
            key={feature.id}
            className={`feature-card ${
              formData.selectedFeatures.includes(feature.id) ? 'selected' : ''
            } ${feature.required ? 'required' : ''}`}
          >
            <div className="feature-header">
              <input
                type="checkbox"
                id={feature.id}
                checked={formData.selectedFeatures.includes(feature.id)}
                onChange={() => handleFeatureToggle(feature.id)}
                disabled={feature.required}
              />
              <label htmlFor={feature.id} className="feature-name">
                {feature.name}
                {feature.required && <span className="required-badge">Required</span>}
              </label>
            </div>
            <p className="feature-description">{feature.description}</p>
          </div>
        ))}
      </div>

      <div className="plan-recommendation">
        <h4>Recommended Plan</h4>
        <div className="plan-card recommended">
          <h5>{subscriptionPlans[getRecommendedPlan()].name}</h5>
          <div className="plan-price">${subscriptionPlans[getRecommendedPlan()].price}/month</div>
          <p>{subscriptionPlans[getRecommendedPlan()].description}</p>
        </div>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div>
      <h3 className="step-title">Payment & Billing</h3>
      <p className="step-description">Secure payment setup for your subscription</p>

      <div className="form-group">
        <label htmlFor="paymentInfo.cardholderName" className="form-label">
          Cardholder Name *
        </label>
        <input
          type="text"
          id="paymentInfo.cardholderName"
          name="paymentInfo.cardholderName"
          value={formData.paymentInfo.cardholderName}
          onChange={handleChange}
          className="form-input"
          placeholder="Name on card"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="paymentInfo.cardNumber" className="form-label">
          Card Number *
        </label>
        <input
          type="text"
          id="paymentInfo.cardNumber"
          name="paymentInfo.cardNumber"
          value={formData.paymentInfo.cardNumber}
          onChange={handleChange}
          className="form-input"
          placeholder="1234 5678 9012 3456"
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label htmlFor="paymentInfo.expiryDate" className="form-label">
            Expiry Date *
          </label>
          <input
            type="text"
            id="paymentInfo.expiryDate"
            name="paymentInfo.expiryDate"
            value={formData.paymentInfo.expiryDate}
            onChange={handleChange}
            className="form-input"
            placeholder="MM/YY"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="paymentInfo.cvv" className="form-label">
            CVV *
          </label>
          <input
            type="text"
            id="paymentInfo.cvv"
            name="paymentInfo.cvv"
            value={formData.paymentInfo.cvv}
            onChange={handleChange}
            className="form-input"
            placeholder="123"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="billingAddress.sameAsRestaurant"
            name="billingAddress.sameAsRestaurant"
            checked={formData.billingAddress.sameAsRestaurant}
            onChange={handleChange}
          />
          <label htmlFor="billingAddress.sameAsRestaurant">
            Billing address same as restaurant address
          </label>
        </div>
      </div>

      {!formData.billingAddress.sameAsRestaurant && (
        <>
          <h4>Billing Address</h4>
          <div className="form-group">
            <label htmlFor="billingAddress.street" className="form-label">
              Street Address *
            </label>
            <input
              type="text"
              id="billingAddress.street"
              name="billingAddress.street"
              value={formData.billingAddress.street}
              onChange={handleChange}
              className="form-input"
              placeholder="123 Billing Street"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="billingAddress.city" className="form-label">
                City *
              </label>
              <input
                type="text"
                id="billingAddress.city"
                name="billingAddress.city"
                value={formData.billingAddress.city}
                onChange={handleChange}
                className="form-input"
                placeholder="City"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="billingAddress.state" className="form-label">
                State *
              </label>
              <input
                type="text"
                id="billingAddress.state"
                name="billingAddress.state"
                value={formData.billingAddress.state}
                onChange={handleChange}
                className="form-input"
                placeholder="State"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="billingAddress.zipCode" className="form-label">
                ZIP Code *
              </label>
              <input
                type="text"
                id="billingAddress.zipCode"
                name="billingAddress.zipCode"
                value={formData.billingAddress.zipCode}
                onChange={handleChange}
                className="form-input"
                placeholder="12345"
                required
              />
            </div>
          </div>
        </>
      )}

      <div className="form-group">
        <div className="checkbox-group">
          <input
            type="checkbox"
            id="marketingConsent"
            name="marketingConsent"
            checked={formData.marketingConsent}
            onChange={handleChange}
          />
          <label htmlFor="marketingConsent">
            I'd like to receive marketing updates and special offers
          </label>
        </div>
      </div>

      <div className="plan-summary">
        <h4>Plan Summary</h4>
        <div className="summary-item">
          <span>Plan: {subscriptionPlans[getRecommendedPlan()].name}</span>
          <span>${subscriptionPlans[getRecommendedPlan()].price}/month</span>
        </div>
        <div className="summary-item">
          <span>Features: {formData.selectedFeatures.length} selected</span>
        </div>
      </div>

      <div className="security-notice">
        <p>
          🔒 Your payment information is encrypted and secure. We use industry-standard PCI
          compliance.
        </p>
      </div>
    </div>
  );
  return (
    <div className="auth-container">
      <div className="auth-card restaurant-registration">
        <h2 className="auth-title">Register Your Restaurant</h2>
        <p className="subtitle">
          Join the à la carte platform and modernize your restaurant experience
        </p>

        {renderProgressBar()}

        {error && <div className="error-alert">{error}</div>}

        <form onSubmit={currentStep === 5 ? handleSubmit : (e) => e.preventDefault()}>
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          {currentStep === 4 && renderStep4()}
          {currentStep === 5 && renderStep5()}

          <div className="form-actions">
            {currentStep > 1 && (
              <button type="button" onClick={prevStep} className="auth-button secondary">
                Previous
              </button>
            )}

            {currentStep < 5 ? (
              <button type="button" onClick={nextStep} className="auth-button primary">
                Next Step
              </button>
            ) : (
              <button type="submit" className="auth-button primary">
                Complete Registration
              </button>
            )}
          </div>

          {currentStep === 1 && (
            <div className="auth-footer">
              <p>
                Already have an account?{' '}
                <Link to="/login" className="auth-link">
                  Sign In
                </Link>
              </p>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

export default RegisterPage;
