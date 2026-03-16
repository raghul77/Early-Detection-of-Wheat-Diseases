import { useState } from "react";
import { X, Plus, Trash2, Edit2, MapPin, Maximize } from "lucide-react";

const FieldManagementModal = ({ isOpen, onClose, fields, onUpdateFields }) => {
  const [editingField, setEditingField] = useState(null);
  const [newField, setNewField] = useState({ name: "", area: "", location: "" });
  const [isAdding, setIsAdding] = useState(false);

  if (!isOpen) return null;

  const handleAddField = () => {
    if (!newField.name || !newField.area) {
      alert("Please enter field name and area");
      return;
    }

    const field = {
      id: Date.now(),
      name: newField.name,
      area: parseFloat(newField.area),
      location: newField.location || "Not specified",
      createdAt: new Date().toISOString(),
      diseaseCount: 0,
      healthyCount: 0,
      totalScans: 0
    };

    onUpdateFields([...fields, field]);
    setNewField({ name: "", area: "", location: "" });
    setIsAdding(false);
  };

  const handleDeleteField = (fieldId) => {
    if (window.confirm("Are you sure you want to delete this field?")) {
      onUpdateFields(fields.filter(f => f.id !== fieldId));
    }
  };

  const handleEditField = (field) => {
    setEditingField({ ...field });
  };

  const handleSaveEdit = () => {
    onUpdateFields(fields.map(f => 
      f.id === editingField.id ? editingField : f
    ));
    setEditingField(null);
  };

  const totalArea = fields.reduce((sum, f) => sum + f.area, 0);
  const totalDiseases = fields.reduce((sum, f) => sum + (f.diseaseCount || 0), 0);
  const diseasePerAcre = totalArea > 0 ? (totalDiseases / totalArea).toFixed(2) : 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-6 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🌾 Field Management
            </h2>
            <p className="text-green-100 text-sm mt-1">Manage and monitor your agricultural fields</p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-6 bg-green-50 border-b">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-700">{fields.length}</p>
            <p className="text-sm text-gray-600">Total Fields</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-700">{totalArea.toFixed(1)}</p>
            <p className="text-sm text-gray-600">Total Acres</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-green-700">{diseasePerAcre}</p>
            <p className="text-sm text-gray-600">Diseases/Acre</p>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[50vh]">
          {/* Add New Field Button */}
          {!isAdding && (
            <button
              onClick={() => setIsAdding(true)}
              className="w-full mb-4 p-4 border-2 border-dashed border-green-300 rounded-xl hover:border-green-500 hover:bg-green-50 transition-all flex items-center justify-center gap-2 text-green-700 font-semibold"
            >
              <Plus className="h-5 w-5" />
              Add New Field
            </button>
          )}

          {/* Add Field Form */}
          {isAdding && (
            <div className="mb-6 p-4 border-2 border-green-300 rounded-xl bg-green-50">
              <h3 className="font-bold text-lg mb-4 text-green-800">Add New Field</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Field Name *
                  </label>
                  <input
                    type="text"
                    value={newField.name}
                    onChange={(e) => setNewField({ ...newField, name: e.target.value })}
                    placeholder="e.g., North Field"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Area (Acres) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={newField.area}
                    onChange={(e) => setNewField({ ...newField, area: e.target.value })}
                    placeholder="e.g., 2.5"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    type="text"
                    value={newField.location}
                    onChange={(e) => setNewField({ ...newField, location: e.target.value })}
                    placeholder="e.g., Plot 42"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleAddField}
                  className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors font-semibold"
                >
                  Add Field
                </button>
                <button
                  onClick={() => {
                    setIsAdding(false);
                    setNewField({ name: "", area: "", location: "" });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Fields List */}
          <div className="space-y-3">
            {fields.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <MapPin className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-lg font-medium">No fields added yet</p>
                <p className="text-sm">Click "Add New Field" to get started</p>
              </div>
            ) : (
              fields.map((field) => (
                <div
                  key={field.id}
                  className="border-2 border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow bg-white"
                >
                  {editingField?.id === field.id ? (
                    // Edit Mode
                    <div>
                      <div className="grid md:grid-cols-3 gap-4 mb-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Field Name
                          </label>
                          <input
                            type="text"
                            value={editingField.name}
                            onChange={(e) => setEditingField({ ...editingField, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Area (Acres)
                          </label>
                          <input
                            type="number"
                            step="0.1"
                            value={editingField.area}
                            onChange={(e) => setEditingField({ ...editingField, area: parseFloat(e.target.value) })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Location
                          </label>
                          <input
                            type="text"
                            value={editingField.location}
                            onChange={(e) => setEditingField({ ...editingField, location: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                          />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors text-sm font-semibold"
                        >
                          Save Changes
                        </button>
                        <button
                          onClick={() => setEditingField(null)}
                          className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors text-sm font-semibold"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View Mode
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold text-gray-800">{field.name}</h3>
                          <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                            {field.area} acres
                          </span>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <p className="text-gray-500">Location</p>
                            <p className="font-semibold text-gray-700">{field.location}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Total Scans</p>
                            <p className="font-semibold text-gray-700">{field.totalScans || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Diseases</p>
                            <p className="font-semibold text-red-600">{field.diseaseCount || 0}</p>
                          </div>
                          <div>
                            <p className="text-gray-500">Health Rate</p>
                            <p className="font-semibold text-green-600">
                              {field.totalScans > 0 
                                ? ((field.healthyCount || 0) / field.totalScans * 100).toFixed(0)
                                : 0}%
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditField(field)}
                          className="p-2 bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200 transition-colors"
                          title="Edit Field"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDeleteField(field.id)}
                          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                          title="Delete Field"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t flex justify-end">
          <button
            onClick={onClose}
            className="bg-green-600 text-white py-2 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default FieldManagementModal;