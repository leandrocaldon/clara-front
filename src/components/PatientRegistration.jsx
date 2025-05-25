import { useState } from 'react';
import { FaUser, FaIdCard, FaCalendarAlt, FaVenusMars, FaEnvelope, FaPhone } from 'react-icons/fa';

const PatientRegistration = ({ onRegister, onBack }) => {
  const [formData, setFormData] = useState({
    patientId: '',
    name: '',
    age: '',
    gender: '',
    email: '',
    phone: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    if (!formData.patientId || !formData.name || !formData.age || !formData.gender) {
      setError('Por favor complete todos los campos obligatorios');
      setIsLoading(false);
      return;
    }

    try {
      await onRegister(formData);
    } catch (error) {
      setError(error.message || 'Error al registrar paciente');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white shadow-2xl rounded-xl overflow-hidden border border-purple-200 mx-auto max-w-2xl">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-6 text-center">
        <h2 className="text-2xl font-bold flex items-center justify-center">
          <FaUser className="mr-3 text-purple-200" /> Registro de Paciente
        </h2>
        <p className="mt-2 text-purple-200">Dra. Clara necesita conocerte para brindarte una mejor atención</p>
      </div>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        {/* ID del Paciente */}
        <div>
          <label className="flex items-center text-gray-700 font-medium mb-2">
            <FaIdCard className="mr-2 text-purple-600" />
            Número de Documento / ID *
          </label>
          <input
            type="text"
            name="patientId"
            value={formData.patientId}
            onChange={handleChange}
            placeholder="Cédula, Pasaporte, etc."
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        {/* Nombre */}
        <div>
          <label className="flex items-center text-gray-700 font-medium mb-2">
            <FaUser className="mr-2 text-purple-600" />
            Nombre Completo *
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Tu nombre completo"
            className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>

        {/* Edad y Género en la misma fila */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-gray-700 font-medium mb-2">
              <FaCalendarAlt className="mr-2 text-purple-600" />
              Edad *
            </label>
            <input
              type="number"
              name="age"
              value={formData.age}
              onChange={handleChange}
              placeholder="Años"
              min="0"
              max="120"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>

          <div>
            <label className="flex items-center text-gray-700 font-medium mb-2">
              <FaVenusMars className="mr-2 text-purple-600" />
              Género *
            </label>
            <select
              name="gender"
              value={formData.gender}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            >
              <option value="">Seleccionar</option>
              <option value="masculino">Masculino</option>
              <option value="femenino">Femenino</option>
              <option value="otro">Otro</option>
            </select>
          </div>
        </div>

        {/* Contacto opcional */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="flex items-center text-gray-700 font-medium mb-2">
              <FaEnvelope className="mr-2 text-purple-600" />
              Email (opcional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="correo@ejemplo.com"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="flex items-center text-gray-700 font-medium mb-2">
              <FaPhone className="mr-2 text-purple-600" />
              Teléfono (opcional)
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Número de teléfono"
              className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>
        </div>

        {/* Botones */}
        <div className="flex space-x-3 pt-4">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 px-4 rounded-lg transition-all"
            >
              Volver
            </button>
          )}
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-3 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
          >
            {isLoading ? 'Registrando...' : 'Continuar con Dra. Clara'}
          </button>
        </div>

        <p className="text-xs text-gray-500 text-center mt-4">
          * Campos obligatorios. Tu información se maneja de forma confidencial.
        </p>
      </form>
    </div>
  );
};

export default PatientRegistration; 