import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { FaPaperPlane, FaRobot, FaUser, FaClipboardList } from 'react-icons/fa'
import PatientRegistration from './PatientRegistration'

const ChatPrompt = () => {
  // URL base de la API - usando el backend desplegado en Vercel
  const API_BASE_URL = 'https://clara-back.vercel.app'
  
  const [prompt, setPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [conversations, setConversations] = useState([])
  const [sessionId, setSessionId] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [currentPatient, setCurrentPatient] = useState(null)
  const [showRegistration, setShowRegistration] = useState(true)
  const conversationsEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Inicializar o obtener sessionId y verificar registro
  useEffect(() => {
    const getOrCreateSessionId = () => {
      let existingSessionId = localStorage.getItem('sessionId');
      if (!existingSessionId) {
        existingSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('sessionId', existingSessionId);
      }
      setSessionId(existingSessionId);
      return existingSessionId;
    };

    const checkPatientRegistration = async (sessionId) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/chat/patient/${sessionId}`);
        if (response.data && response.data.isRegistered) {
          setCurrentPatient(response.data);
          setIsRegistered(true);
          setShowRegistration(false);
          loadConversationHistory(sessionId);
        }
      } catch (error) {
        console.log('Paciente no registrado, mostrando formulario de registro');
        setShowRegistration(true);
      }
    };

    const loadConversationHistory = async (sessionId) => {
      try {
        const response = await axios.get(`${API_BASE_URL}/api/chat/history?sessionId=${sessionId}`);
        const history = response.data.map(conv => [
          { role: 'user', content: conv.prompt },
          { role: 'assistant', content: conv.response }
        ]).flat();
        setConversations(history);
      } catch (error) {
        console.error('Error al cargar historial:', error);
      }
    };

    const sessionId = getOrCreateSessionId();
    checkPatientRegistration(sessionId);
  }, []);

  // Auto-scroll cuando hay nuevos mensajes
  useEffect(() => {
    if (conversationsEndRef.current) {
      conversationsEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [conversations])

  // Función para registrar paciente
  const handlePatientRegistration = async (patientData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/chat/register`, {
        ...patientData,
        sessionId
      });

      setCurrentPatient(response.data.patient);
      setIsRegistered(true);
      setShowRegistration(false);

      // Agregar mensaje de bienvenida
      setConversations([
        { role: 'assistant', content: response.data.message }
      ]);

    } catch (error) {
      throw new Error(error.response?.data?.error || 'Error al registrar paciente');
    }
  };

  // Función para buscar paciente existente
  const handleFindPatient = async (patientId) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/chat/find/${patientId}`);
      
      // Crear nueva sesión para paciente existente
      const newResponse = await axios.post(`${API_BASE_URL}/api/chat/register`, {
        patientId: response.data.patientId,
        name: response.data.name,
        age: response.data.age,
        gender: response.data.gender,
        email: response.data.email,
        phone: response.data.phone,
        sessionId
      });

      setCurrentPatient(newResponse.data.patient);
      setIsRegistered(true);
      setShowRegistration(false);

      // Agregar mensaje de bienvenida
      setConversations([
        { role: 'assistant', content: newResponse.data.message }
      ]);

    } catch (error) {
      throw new Error('Paciente no encontrado');
    }
  };

  // Agregar manejador de tecla Enter
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!prompt.trim() || !sessionId || !isRegistered) return
    
    try {
      setIsLoading(true)
      
      // Agregar el prompt del usuario a las conversaciones
      const newConversations = [
        ...conversations, 
        { role: 'user', content: prompt }
      ]
      setConversations(newConversations)
      setPrompt('')
      
      const res = await axios.post(`${API_BASE_URL}/api/chat`, { 
        prompt, 
        sessionId 
      })
      
      // Agregar la respuesta de la IA a las conversaciones
      setConversations([
        ...newConversations,
        { role: 'assistant', content: res.data.response }
      ])
    } catch (error) {
      console.error('Error al obtener respuesta:', error)
      let errorMessage = 'Lo siento, hubo un error al procesar tu solicitud. Por favor intenta de nuevo. 😕';
      
      if (error.response?.data?.error === 'Paciente no registrado. Por favor complete el registro primero.') {
        errorMessage = 'Tu sesión expiró. Por favor regístrate nuevamente.';
        setIsRegistered(false);
        setShowRegistration(true);
      }
      
      setConversations([
        ...conversations,
        { role: 'user', content: prompt },
        { role: 'system', content: errorMessage }
      ])
      setPrompt('')
    } finally {
      setIsLoading(false)
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  }

  // Nueva función para limpiar el historial y crear nueva sesión
  const handleNewSession = () => {
    const newSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('sessionId', newSessionId);
    setSessionId(newSessionId);
    setConversations([]);
    setIsRegistered(false);
    setCurrentPatient(null);
    setShowRegistration(true);
  };

  // Función para formatear el texto con saltos de línea
  const formatText = (text, isUser = false) => {
    return text.split('\n').map((paragraph, i) => (
      <p key={i} className={`mb-2 last:mb-0 ${isUser ? '!text-white' : ''}`}>{paragraph}</p>
    ));
  };

  // Si no está registrado, mostrar formulario de registro
  if (showRegistration) {
    return (
      <div className="space-y-4">
        <PatientRegistration 
          onRegister={handlePatientRegistration}
        />
        
        {/* Opción para pacientes existentes */}
        <div className="bg-white shadow-lg rounded-xl p-6 border border-purple-200 mx-auto max-w-2xl">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              ¿Ya eres paciente de Dra. Clara?
            </h3>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Ingresa tu ID de paciente"
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleFindPatient(e.target.value);
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.target.previousElementSibling;
                  if (input.value.trim()) {
                    handleFindPatient(input.value.trim());
                  }
                }}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all"
              >
                <FaClipboardList className="inline mr-2" />
                Buscar
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-2xl rounded-xl overflow-hidden border border-purple-200 mx-auto max-w-2xl">
      {/* Header del chat */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 text-center shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold flex items-center">
              <FaRobot className="mr-2 text-purple-200" /> Dra. Clara
            </h2>
            {currentPatient && (
              <p className="text-sm text-purple-200 mt-1">
                Atendiendo a: {currentPatient.name} (Consulta #{currentPatient.consultationCount})
              </p>
            )}
          </div>
          <button
            onClick={handleNewSession}
            className="text-xs bg-purple-500 hover:bg-purple-700 px-3 py-1 rounded-full transition-all"
            title="Nueva consulta"
          >
            Nueva Consulta
          </button>
        </div>
        {sessionId && (
          <p className="text-xs text-purple-200 mt-1">
            Sesión: {sessionId.slice(-8)}
          </p>
        )}
      </div>
      
      {/* Historial de conversaciones */}
      <div className="h-[400px] overflow-y-auto p-4 bg-gradient-to-b from-purple-50 to-white">
        {conversations.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-600">
            <div className="p-6 bg-purple-100 rounded-full mb-4 shadow-inner">
              <FaRobot className="text-5xl text-purple-600" />
            </div>
            <p className="text-xl font-semibold text-purple-800">
              ¡Hola {currentPatient?.name}! 👋
            </p>
            <p className="mt-2 text-purple-600">¿Cómo te sientes hoy?</p>
            <p className="mt-1 text-sm text-purple-500">Cuéntame sobre tus síntomas</p>
          </div>
        ) : (
          <div className="space-y-5">
            {conversations.map((message, index) => (
              <div 
                key={index} 
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`max-w-[85%] p-3 rounded-2xl shadow-md ${
                    message.role === 'user' 
                      ? 'bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-tr-none' 
                      : message.role === 'system'
                        ? 'bg-red-100 text-red-700 border border-red-200'
                        : 'bg-white text-gray-800 border border-purple-100 rounded-tl-none shadow-md'
                  }`}
                >
                  <div className="flex items-center mb-1 font-medium">
                    {message.role === 'user' ? (
                      <>
                        <FaUser className="mr-1 text-white" /> 
                        <span className="text-white font-bold">{currentPatient?.name || 'Tú'}</span>
                      </>
                    ) : message.role === 'system' ? (
                      'Sistema'
                    ) : (
                      <>
                        <FaRobot className="mr-1 text-purple-600" /> 
                        <span className="text-purple-800">Dra. Clara</span>
                      </>
                    )}
                  </div>
                  <div className={`whitespace-pre-wrap leading-relaxed text-sm md:text-base ${message.role === 'user' ? 'font-medium !text-white' : ''}`}>
                    {formatText(message.content, message.role === 'user')}
                  </div>
                </div>
              </div>
            ))}
            <div ref={conversationsEndRef} />
          </div>
        )}
        
        {isLoading && (
          <div className="flex justify-start mt-4">
            <div className="max-w-[85%] p-3 bg-white border border-purple-100 rounded-2xl rounded-tl-none shadow-md">
              <div className="flex items-center mb-1 font-medium">
                <FaRobot className="mr-1 text-purple-600" /> 
                <span className="text-purple-800">Dra. Clara</span>
              </div>
              <div className="flex space-x-3">
                <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Formulario para enviar el prompt */}
      <form onSubmit={handleSubmit} className="p-4 bg-gradient-to-r from-purple-100 to-indigo-100 border-t border-purple-200">
        <div className="mb-2">
          <textarea
            ref={textareaRef}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe tus síntomas o comparte cómo te sientes..."
            className="w-full p-3 border border-purple-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white text-gray-800 resize-none shadow-inner transition-all"
            rows="2"
            disabled={isLoading || !isRegistered}
          />
        </div>
        
        <div className="flex items-center">
          <button
            type="submit"
            disabled={isLoading || !prompt.trim() || !isRegistered}
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-2 px-4 rounded-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-all flex items-center justify-center"
          >
            <FaPaperPlane className="mr-2" /> Enviar
          </button>
        </div>
        
        <p className="text-xs text-purple-500 mt-1 text-center">
          {isLoading ? '⏳ Dra. Clara está analizando...' : '💬 Presiona Enter para enviar'}
        </p>
      </form>
    </div>
  )
}

export default ChatPrompt
