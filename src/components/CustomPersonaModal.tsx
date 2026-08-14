import React, { useState } from 'react';
import { Persona } from '../types';
import {
  X,
  Plus,
  Sparkles,
  Bot,
  Code2,
  BookOpen,
  Briefcase,
  Lightbulb,
  HeartHandshake,
  MessageSquare,
  Trash2,
} from 'lucide-react';

interface CustomPersonaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSavePersona: (persona: Omit<Persona, 'id'>) => void;
  customPersonas: Persona[];
  onDeletePersona: (id: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'Sparkles', icon: Sparkles, label: 'Creative / Magic' },
  { name: 'Bot', icon: Bot, label: 'Assistant / General' },
  { name: 'Code2', icon: Code2, label: 'Developer / Code' },
  { name: 'BookOpen', icon: BookOpen, label: 'Education / Research' },
  { name: 'Briefcase', icon: Briefcase, label: 'Business / Finance' },
  { name: 'Lightbulb', icon: Lightbulb, label: 'Ideas & Innovation' },
  { name: 'HeartHandshake', icon: HeartHandshake, label: 'Counselor & Empathy' },
  { name: 'MessageSquare', icon: MessageSquare, label: 'Social & Chat' },
];

export const CustomPersonaModal: React.FC<CustomPersonaModalProps> = ({
  isOpen,
  onClose,
  onSavePersona,
  customPersonas,
  onDeletePersona,
}) => {
  const [name, setName] = useState('');
  const [roleTag, setRoleTag] = useState('');
  const [description, setDescription] = useState('');
  const [systemInstruction, setSystemInstruction] = useState('');
  const [iconName, setIconName] = useState('Sparkles');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !systemInstruction.trim()) return;

    onSavePersona({
      name: name.trim(),
      roleTag: roleTag.trim() || 'Custom Persona',
      iconName,
      description: description.trim() || `Custom AI assistant for ${name.trim()}`,
      systemInstruction: `${systemInstruction.trim()}\nAlways identify as SAS AI created by Sasnula Dilum.`,
      isCustom: true,
    });

    setName('');
    setRoleTag('');
    setDescription('');
    setSystemInstruction('');
    setIconName('Sparkles');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-950/60 p-4 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border border-neutral-200/80 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-neutral-100 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-neutral-900">Custom Personas</h3>
              <p className="text-xs text-neutral-500">
                Design custom AI expert behaviors and system instructions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* List of existing custom personas */}
          {customPersonas.length > 0 && (
            <div>
              <h4 className="mb-2 text-xs font-bold uppercase tracking-wider text-neutral-400">
                Your Custom Personas ({customPersonas.length})
              </h4>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {customPersonas.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-start justify-between rounded-xl border border-neutral-200 bg-neutral-50 p-3 shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-neutral-900">{p.name}</span>
                        <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-semibold text-blue-700">
                          {p.roleTag}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[11px] text-neutral-500">
                        {p.description}
                      </p>
                    </div>
                    <button
                      onClick={() => onDeletePersona(p.id)}
                      className="text-neutral-400 hover:text-rose-600 transition p-1"
                      title="Delete Persona"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Form to create new persona */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Create New Persona
            </h4>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">
                  Persona Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal Advisor, Bio Tutor"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold text-neutral-700">
                  Role / Tag
                </label>
                <input
                  type="text"
                  placeholder="e.g. Law & Contracts"
                  value={roleTag}
                  onChange={(e) => setRoleTag(e.target.value)}
                  className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-700">
                Icon Style
              </label>
              <div className="flex flex-wrap gap-2">
                {AVAILABLE_ICONS.map((item) => {
                  const Icon = item.icon;
                  const isSelected = iconName === item.name;
                  return (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setIconName(item.name)}
                      className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs transition ${
                        isSelected
                          ? 'border-blue-500 bg-blue-50 text-blue-700 font-semibold shadow-xs'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-700">
                Short Description
              </label>
              <input
                type="text"
                placeholder="e.g. Analyzes legal contracts, NDA agreements, and case summaries."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold text-neutral-700">
                System Instructions & Rules *
              </label>
              <textarea
                required
                rows={4}
                placeholder="Define how SAS AI should behave, its knowledge domain, tone of voice, formatting rules, etc."
                value={systemInstruction}
                onChange={(e) => setSystemInstruction(e.target.value)}
                className="w-full resize-none rounded-xl border border-neutral-300 px-3 py-2 text-xs text-neutral-900 placeholder-neutral-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/15"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-neutral-300 px-4 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-blue-700 transition active:scale-95"
              >
                <Plus className="h-4 w-4" />
                <span>Save Persona</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
