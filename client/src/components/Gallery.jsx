import { useEffect, useState } from "react";
import axios from "axios";

const Gallery = ({ refreshTrigger }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDocuments = async () => {
    try {
      const userInfo = JSON.parse(localStorage.getItem("userInfo"));
      const token = userInfo?.token;

      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/documents`, config);
      setDocuments(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching gallery:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [refreshTrigger]);

  if (loading) return <p>Loading Gallery...</p>;

  return (
    <div className="max-w-6xl mx-auto mt-16 px-4 pb-20">
      <div className="flex items-center justify-between mb-8 border-b border-gray-800 pb-4">
        <h2 className="text-2xl font-bold text-white">Your Scans</h2>
        <span className="text-gray-500 text-sm">{documents.length} items</span>
      </div>
      
      {documents.length === 0 ? (
        <div className="text-center py-20 bg-dark-800 rounded-xl border border-dashed border-gray-700">
          <p className="text-gray-400 text-lg">Your gallery is empty.</p>
          <p className="text-gray-600 text-sm mt-2">Scan your first document above!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {documents.map((doc) => (
            <div key={doc._id} className="group bg-dark-800 rounded-xl overflow-hidden border border-gray-800 hover:border-brand-500 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              
              <div className="relative h-48 overflow-hidden bg-gray-900">
                <img 
                  src={`${import.meta.env.VITE_API_URL}/uploads/${doc.croppedFile}`} 
                  alt="Scanned" 
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500" 
                />
                
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
                   <a 
                     href={`http://localhost:3000/uploads/${doc.croppedFile}`} 
                     target="_blank" 
                     rel="noreferrer"
                     className="px-4 py-2 bg-white text-black rounded-full text-sm font-bold shadow-lg hover:bg-gray-200"
                   >
                     View Full
                   </a>
                </div>
              </div>

              <div className="p-4">
                <h3 className="text-white font-medium truncate" title={doc.originalName}>{doc.originalName}</h3>
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs text-gray-500">{new Date(doc.createdAt).toLocaleDateString()}</span>
                  <span className="px-2 py-1 bg-green-900/30 text-green-400 text-xs rounded border border-green-900">Scanned</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Gallery;