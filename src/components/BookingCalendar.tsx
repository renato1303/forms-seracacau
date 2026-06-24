import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar as CalendarIcon, Loader2, AlertCircle, PhoneCall
} from 'lucide-react';
import { LeadData, IntegrationConfig } from '../types';

interface BookingCalendarProps {
  lead: LeadData;
  onBookingComplete: (date: string, hour: string, meetLink: string) => void;
  onBackToSummary: () => void;
}

export default function BookingCalendar({ lead, onBookingComplete, onBackToSummary }: BookingCalendarProps) {
  const [isLoadingIframe, setIsLoadingIframe] = useState(true);
  const [calendlyUrl, setCalendlyUrl] = useState('https://calendly.com/comercial-seracacau/30min');
  const [hasError, setHasError] = useState(false);

  // Load custom configured Calendly link if set in configurations
  useEffect(() => {
    const storedConfig = localStorage.getItem('sensesales_integrations_config');
    if (storedConfig) {
      try {
        const config: IntegrationConfig = JSON.parse(storedConfig);
        if (config.calendlyUrl) {
          setCalendlyUrl(config.calendlyUrl);
        }
      } catch (err) {
        console.error('Error reading integrations config for Calendly:', err);
      }
    }
  }, []);

  // Listen for Calendly event successfully scheduled postMessage
  useEffect(() => {
    function handleCalendlyMessage(e: MessageEvent) {
      if (e.data && e.data.event && e.data.event === 'calendly.event_scheduled') {
        const todayStr = new Date().toLocaleDateString('pt-BR');
        onBookingComplete(
          todayStr,
          'Confirmado no Calendly',
          'Link enviado pelo Calendly (E-mail/WhatsApp)'
        );
      }
    }

    window.addEventListener('message', handleCalendlyMessage);
    return () => {
      window.removeEventListener('message', handleCalendlyMessage);
    };
  }, [onBookingComplete]);

  // Construct optimized prefilled embedding URL for Calendly
  const getPrefilledUrl = () => {
    try {
      const urlObj = new URL(calendlyUrl);
      
      if (lead.nome) {
        urlObj.searchParams.append('name', lead.nome);
      }
      if (lead.email) {
        urlObj.searchParams.append('email', lead.email);
      }
      
      const phoneVal = lead.whatsapp || lead.telefone || '';
      if (phoneVal) {
        urlObj.searchParams.append('phone', phoneVal);
        urlObj.searchParams.append('a1', phoneVal);
      }

      urlObj.searchParams.append('hide_event_type_details', '1');
      urlObj.searchParams.append('hide_gdpr_banner', '1');

      return urlObj.toString();
    } catch (e) {
      return `${calendlyUrl}?name=${encodeURIComponent(lead.nome || '')}&email=${encodeURIComponent(lead.email || '')}`;
    }
  };

  const iframeSrc = getPrefilledUrl();

  return (
    <div className="w-full space-y-6 p-4 sm:p-6 md:p-8 glass-panel rounded-2xl sm:rounded-[32px] shadow-sm relative overflow-hidden text-left" id="calendar-booking-card">
      
      {/* Header Info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200 pb-5">
        <div>
          <h2 className="font-display font-semibold text-xl sm:text-2xl text-gray-900 tracking-tight">
            Reserve o Horário do seu Diagnóstico
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            Escolha uma data e horário em nossa agenda e confirme em poucos segundos.
          </p>
        </div>

        {/* Dynamic Indicator */}
        <div className="shrink-0 flex items-center gap-2 bg-[#FAFAF8] border border-gray-200 px-3 py-2 rounded-xl text-xs">
          <div className="w-2 h-2 rounded-full bg-[#14B8A6] animate-pulse" />
          <span className="text-gray-900 font-medium text-[11px] font-sans">Agendamento Exclusivo e Rápido</span>
        </div>
      </div>

      {/* Embedded Iframe Container */}
      <div className="relative w-full h-[500px] xs:h-[560px] sm:h-[620px] bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
        {isLoadingIframe && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white space-y-4 z-10">
            <Loader2 className="w-8 h-8 text-[#008060] animate-spin" />
            <div className="text-center space-y-1">
              <p className="text-xs font-mono text-gray-900 font-semibold tracking-wider">ESTRUTURANDO DIAGNÓSTICO...</p>
              <p className="text-[10px] text-gray-400">Sincronizando agenda do Calendly em tempo real.</p>
            </div>
          </div>
        )}

        {!hasError ? (
          <iframe 
            src={iframeSrc}
            width="100%"
            height="100%"
            frameBorder="0"
            title="Calendly Scheduling"
            onLoad={() => setIsLoadingIframe(false)}
            onError={() => {
              setHasError(true);
              setIsLoadingIframe(false);
            }}
            className="w-full h-full rounded-2xl"
            id="calendly-frame"
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4 bg-white">
            <AlertCircle className="w-12 h-12 text-rose-500" />
            <p className="text-sm font-sans font-medium text-gray-900">Não foi possível exibir a agenda do Calendly.</p>
            <p className="text-xs text-gray-500 max-w-md leading-relaxed">
              Verifique se sua conexão de rede está ativa ou tente abrir o link do agendamento diretamente no seu navegador.
            </p>
            <a 
              href={calendlyUrl} 
              target="_blank" 
              rel="noreferrer" 
              className="px-6 py-3 bg-[#008060] text-white hover:bg-[#00664d] font-semibold text-xs rounded-xl shadow-sm"
            >
              Abrir Agenda Externa
            </a>
          </div>
        )}
      </div>

      {/* Sleek bottom control bar for backing out of Scheduling */}
      <div className="pt-6 border-t border-gray-200 flex justify-between items-center" id="calendar-bottom-controls">
        <button
          onClick={onBackToSummary}
          className="px-5 py-2.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-750 text-xs font-semibold rounded-xl tracking-wide transition-shadow cursor-pointer inline-flex items-center gap-1.5"
        >
          &larr; Voltar para o Resumo
        </button>

        <p className="text-[10px] text-gray-400 font-mono hidden sm:block">
          Sua reunião será registrada automaticamente ao concluir o fluxo
        </p>
      </div>

    </div>
  );
}
