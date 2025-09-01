import React, { useState, useEffect, useMemo } from 'react';
import type { InfographicData, MarketSummary, MarketBreakdown, Highlight as HighlightType, Kpi, StatusTableRow, MarketOverallStat, MarketLocalStat, ChartDataPoint, PageThreeData } from '../types';
import { exportToPdf } from '../services/pdfService';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, PieChart, Pie, Cell, LabelList } from 'recharts';
import Icon from './Icon';
import EditableValue from './EditableValue';

const WALMART_CHILE_BLUE_LOGO_URL = 'https://static.wikia.nocookie.net/logopedia/images/b/b4/Walmart_Chile_alternate_2025.svg/revision/latest/scale-to-width-down/300?cb=20250718182747';
const STATUS_PIE_COLORS = ['#0053E2', '#A9DDF7']; // true-blue for 'Completado', sky-blue for 'No Completado'
const WALMART_PALETTE = ['#0053E2', '#FFC220', '#40B0F5', '#001E60', '#A9DDF7'];


const MARKET_LOGOS: { [key: string]: string } = {
    'cm': 'https://i.imgur.com/vbe5HmS.png',
    'express': 'https://i.imgur.com/RTGmijK.png',
    'lider': 'https://i.imgur.com/AOxzx9F.png',
    'sba': 'https://i.imgur.com/yKxtX7K.png',
};

const kpiCardColors = [
    { bg: 'bg-true-blue', text: 'text-white', value: 'text-white' },
    { bg: 'bg-bentonville-blue', text: 'text-white', value: 'text-white' },
    { bg: 'bg-sky-blue', text: 'text-bentonville-blue', value: 'text-bentonville-blue' }
];

const Page: React.FC<{children: React.ReactNode}> = ({ children }) => (
    <div className="bg-white text-black w-legal h-legal p-12 flex flex-col font-sans mb-8 border border-gray-200">
        {children}
    </div>
);

const MarketSummaryCard: React.FC<{ 
    summary: MarketSummary,
    onPercentageChange: (newValue: string) => void;
    onStatusTableChange: (rowIndex: number, field: keyof StatusTableRow, newValue: string) => void;
    onAddBar: () => void;
    onRemoveBar: (barIndex: number) => void;
    onBarValueChange: (barIndex: number, newValue: string) => void;
    onBarColorChange: (barIndex: number, newColor: string) => void;
}> = ({ summary, onPercentageChange, onStatusTableChange, onAddBar, onRemoveBar, onBarValueChange, onBarColorChange }) => {
    const [isEditingChart, setIsEditingChart] = useState(false);
    const logoUrl = MARKET_LOGOS[summary.marketName.toLowerCase()];

    const {
        completadoRow,
        noCompletadoRow,
        webinarRow,
        tallerRow,
        ingresosRow,
        completadoRowIndex,
        noCompletadoRowIndex,
        webinarRowIndex,
        tallerRowIndex,
        ingresosRowIndex,
    } = useMemo(() => {
        const findRow = (name: string) => summary.statusTable.find(r => r.name.toLowerCase() === name.toLowerCase());
        const findRowIndex = (name: string) => summary.statusTable.findIndex(r => r.name.toLowerCase() === name.toLowerCase());

        const cRow = findRow('completado');
        const ncRow = findRow('no completado');
        const wRow = findRow('webinar');
        const tRow = findRow('taller');
        const iRow = findRow('ingresos') || findRow('total');
        
        return {
            completadoRow: cRow,
            noCompletadoRow: ncRow,
            webinarRow: wRow,
            tallerRow: tRow,
            ingresosRow: iRow,
            completadoRowIndex: findRowIndex('completado'),
            noCompletadoRowIndex: findRowIndex('no completado'),
            webinarRowIndex: findRowIndex('webinar'),
            tallerRowIndex: findRowIndex('taller'),
            ingresosRowIndex: iRow ? findRowIndex(iRow.name) : -1,
        };
    }, [summary]);

     const pieChartData = useMemo(() => [
        { name: 'Completado', value: summary.mainPercentage },
        { name: 'No Completado', value: 100 - summary.mainPercentage },
    ], [summary.mainPercentage]);


    const processedBarChartData = useMemo(() => {
        if (!summary.barChartData || summary.barChartData.length === 0) return [];
        const minValue = Math.min(...summary.barChartData.map(item => item.value));
        return summary.barChartData.map((item, index) => ({
            ...item,
            name: (index + 1).toString(),
            fill: item.fill || (item.value === minValue ? '#FFC220' : '#40B0F5')
        }));
    }, [summary.barChartData]);

    return (
        <div className="group bg-white rounded-xl p-6 flex flex-col h-full border border-gray-200">
            <div className="flex justify-between items-start mb-4">
                <div>
                    {logoUrl ? <img src={logoUrl} alt={`${summary.marketName} Logo`} className="h-8 object-contain object-left" />
                    : <h4 className="font-bold text-bentonville-blue text-lg flex items-center gap-2"><Icon name="storefront" className="text-gray-500" />{summary.marketName}</h4>}
                    <p className="text-sm text-gray-500 mt-2">Completitud Total</p>
                </div>
                <div className="relative w-20 h-20">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie data={pieChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={25} outerRadius={35} stroke="none">
                                {pieChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={STATUS_PIE_COLORS[index % STATUS_PIE_COLORS.length]} />)}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center text-lg font-bold text-bentonville-blue">
                         <EditableValue 
                            initialValue={`${summary.mainPercentage}`} 
                            onSave={onPercentageChange} 
                            ariaLabel={`Main percentage for ${summary.marketName}`} 
                            fullWidth={false}
                            inputClassName="text-center"
                         />%
                    </div>
                </div>
            </div>
            <div className="text-xs text-gray-700 mb-2">
                <div className="grid grid-cols-3 gap-2 font-bold bg-gray-100 p-2 rounded-t-md text-bentonville-blue">
                    <span>Estado de Avance</span><span className="text-center">Participantes</span><span className="text-right">Status</span>
                </div>
                
                {/* Completado / No Completado Section */}
                {completadoRow && (
                    <div className="grid grid-cols-3 gap-2 p-2 border-b border-gray-100">
                        <span className="flex items-center"><span className="inline-block w-2.5 h-2.5 rounded-full bg-true-blue mr-2 align-middle"></span>Completado</span>
                        <span className="text-center"><EditableValue initialValue={completadoRow.participants || '0'} onSave={(val) => onStatusTableChange(completadoRowIndex, 'participants', val)} ariaLabel={`Participants for Completado`} inputClassName="text-center"/></span>
                        <span className="text-right font-semibold">
                             <EditableValue 
                                initialValue={completadoRow.status ?? `${summary.mainPercentage}%`} 
                                onSave={(val) => onStatusTableChange(completadoRowIndex, 'status', val)} 
                                ariaLabel={`Status for Completado`} 
                                inputClassName="text-right"
                            />
                        </span>
                    </div>
                )}
                {noCompletadoRow && (
                    <div className="grid grid-cols-3 gap-2 p-2">
                        <span className="flex items-center"><span className="inline-block w-2.5 h-2.5 rounded-full bg-sky-blue mr-2 align-middle"></span>No completado</span>
                        <span className="text-center">
                            <EditableValue 
                                initialValue={noCompletadoRow.participants || '0'} 
                                onSave={(val) => onStatusTableChange(noCompletadoRowIndex, 'participants', val)} 
                                ariaLabel={`Participants for No completado`} 
                                inputClassName="text-center"/>
                        </span>
                        <span className="text-right font-semibold">
                            <EditableValue 
                                initialValue={noCompletadoRow.status ?? '0%'} 
                                onSave={(val) => onStatusTableChange(noCompletadoRowIndex, 'status', val)} 
                                ariaLabel={`Status for No completado`} 
                                inputClassName="text-right"/>
                        </span>
                    </div>
                )}

                <div className="my-2 border-t border-gray-200"></div>
                
                {/* Taller / Webinar Section */}
                {tallerRow && (
                    <div className="grid grid-cols-3 gap-2 p-2 border-b border-gray-100">
                        <span>Taller</span>
                        <span className="text-center"><EditableValue initialValue={tallerRow.participants ?? 'x'} onSave={(val) => onStatusTableChange(tallerRowIndex, 'participants', val)} ariaLabel={`Participants for Taller`} inputClassName="text-center"/></span>
                        <span className="text-right font-semibold"><EditableValue initialValue={tallerRow.status ?? 'x'} onSave={(val) => onStatusTableChange(tallerRowIndex, 'status', val)} ariaLabel={`Status for Taller`} inputClassName="text-right"/></span>
                    </div>
                )}
                {webinarRow && (
                     <div className="grid grid-cols-3 gap-2 p-2">
                        <span>Webinar</span>
                        <span className="text-center"><EditableValue initialValue={webinarRow.participants ?? 'x'} onSave={(val) => onStatusTableChange(webinarRowIndex, 'participants', val)} ariaLabel={`Participants for Webinar`} inputClassName="text-center"/></span>
                        <span className="text-right font-semibold"><EditableValue initialValue={webinarRow.status ?? 'x'} onSave={(val) => onStatusTableChange(webinarRowIndex, 'status', val)} ariaLabel={`Status for Webinar`} inputClassName="text-right"/></span>
                    </div>
                )}
                
                <div className="my-2 border-t-2 border-gray-200"></div>

                {/* Ingresos Section */}
                {ingresosRow && (
                    <div className="grid grid-cols-3 gap-2 p-2 font-bold">
                        <span>Ingresos</span>
                        <span className="text-center"><EditableValue initialValue={ingresosRow.participants ?? 'x'} onSave={(val) => onStatusTableChange(ingresosRowIndex, 'participants', val)} ariaLabel={`Participants for Ingresos`} inputClassName="text-center"/></span>
                        <span className="text-right"><EditableValue initialValue={ingresosRow.status ?? 'x'} onSave={(val) => onStatusTableChange(ingresosRowIndex, 'status', val)} ariaLabel={`Status for Ingresos`} inputClassName="text-right"/></span>
                    </div>
                )}
            </div>
            <div className="flex-grow h-40 flex flex-col">
                <div className="flex justify-end mb-1">
                    <button onClick={() => setIsEditingChart(!isEditingChart)} className={`text-gray-500 hover:text-true-blue p-1 rounded-full transition-opacity duration-300 ${isEditingChart ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                        <Icon name={isEditingChart ? 'close' : 'edit'} className="text-lg"/>
                    </button>
                </div>
                 {isEditingChart && (
                    <div className="border rounded-lg p-2 mb-2 text-xs max-h-32 overflow-y-auto">
                        <div className="space-y-2">
                            {summary.barChartData.map((bar, index) => (
                                <div key={index} className="grid grid-cols-4 items-center gap-2">
                                    <span className="font-semibold text-gray-600">Barra {index + 1}</span>
                                    <EditableValue initialValue={String(bar.value)} onSave={(val) => onBarValueChange(index, val)} ariaLabel={`Value for bar ${index + 1}`} inputClassName="text-center" />
                                    <div className="flex items-center justify-center gap-1">
                                        {WALMART_PALETTE.map(color => (
                                            <button
                                                key={color}
                                                onClick={() => onBarColorChange(index, color)}
                                                className={`w-3.5 h-3.5 rounded-full border-2 ${bar.fill === color ? 'border-bentonville-blue' : 'border-transparent'} transition-all`}
                                                style={{ backgroundColor: color }}
                                                aria-label={`Set color to ${color}`}
                                            />
                                        ))}
                                    </div>
                                    <button onClick={() => onRemoveBar(index)} className="text-red-500 hover:text-red-700 justify-self-end">
                                        <Icon name="delete" className="text-base" />
                                    </button>
                                </div>
                            ))}
                        </div>
                         <button onClick={onAddBar} className="mt-2 text-sm text-true-blue font-semibold flex items-center gap-1">
                            <Icon name="add_circle" className="text-base" /> Añadir Barra
                        </button>
                    </div>
                )}
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={processedBarChartData} margin={{ top: 20, right: 15, left: 10, bottom: 5 }}>
                        <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 10, fontFamily: '"Everyday Sans Web", sans-serif' }} 
                        />
                        <YAxis 
                            tick={{ fontSize: 10, fontFamily: '"Everyday Sans Web", sans-serif' }} 
                            domain={[0, 100]} 
                            label={{ value: 'Completitud', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fontSize: 11, fill: '#333', fontFamily: '"Everyday Sans Web", sans-serif' } }} 
                        />
                        <Bar dataKey="value" barSize={10} radius={[4, 4, 0, 0]}>
                            {processedBarChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                            <LabelList dataKey="value" position="top" style={{ fontSize: '10px', fill: '#333', fontFamily: '"Everyday Sans Web", sans-serif' }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

const MarketBreakdownCard: React.FC<{
    breakdown: MarketBreakdown,
    onOverallStatChange: (statIndex: number, newValue: string) => void;
    onLocalStatChange: (statIndex: number, field: keyof MarketLocalStat, newValue: string) => void;
    onAddLocalStat: () => void;
    onRemoveLocalStat: (localIndex: number) => void;
}> = ({ breakdown, onOverallStatChange, onLocalStatChange, onAddLocalStat, onRemoveLocalStat }) => {
    const logoUrl = MARKET_LOGOS[breakdown.marketName.toLowerCase()];
    const completitudStat = breakdown.overallStats.find(s => s.label.toLowerCase().includes('completitud'));
    const participantesStat = breakdown.overallStats.find(s => s.label.toLowerCase().includes('participantes'));
    const webinarStat = breakdown.overallStats.find(s => s.label.toLowerCase().includes('webinar'));
    const tallerStat = breakdown.overallStats.find(s => s.label.toLowerCase().includes('taller'));

    const findStatIndex = (label: string) => breakdown.overallStats.findIndex(s => s.label.toLowerCase().includes(label));

    return (
        <div className="group bg-white border border-gray-200 p-6 rounded-xl flex flex-col">
            <div className="border-b border-gray-200 pb-3 mb-4 flex-shrink-0">
                {logoUrl ? <img src={logoUrl} alt={`${breakdown.marketName} Logo`} className="h-9 object-contain object-left" />
                 : <h4 className="text-xl font-bold text-bentonville-blue flex items-center gap-2"><Icon name="storefront" className="text-true-blue" />{breakdown.marketName}</h4>}
            </div>
            <div className="flex-shrink-0">
                <h5 className="font-semibold text-bentonville-blue mb-3">Indicadores Generales del Formato</h5>
                <div className="grid grid-cols-2 gap-4 mb-6">
                    {completitudStat && (
                         <div className="bg-true-blue text-white p-4 rounded-lg h-28 flex flex-col">
                            <p className="text-sm font-semibold text-white/90">Completitud</p>
                            <div className="flex-grow flex items-end"><p className="text-4xl font-bold"><EditableValue initialValue={completitudStat.value} onSave={(val) => onOverallStatChange(findStatIndex('completitud'), val)} ariaLabel="Completitud value" /></p></div>
                        </div>
                    )}
                    {participantesStat && (
                        <div className="bg-bentonville-blue text-white p-4 rounded-lg h-28 flex flex-col">
                            <p className="text-sm font-semibold text-white/90">Nº Participantes</p>
                            <div className="flex-grow flex items-end"><p className="text-4xl font-bold"><EditableValue initialValue={participantesStat.value} onSave={(val) => onOverallStatChange(findStatIndex('participantes'), val)} ariaLabel="Number of participants" /></p></div>
                        </div>
                    )}
                    {(webinarStat || tallerStat) && (
                        <div className="col-span-2 bg-gray-50 border border-gray-200 rounded-lg flex items-stretch">
                            {webinarStat && (
                                <div className="text-center p-3 flex-1">
                                    <p className="text-sm font-semibold text-gray-500">Asistencia Webinar</p>
                                    <p className="text-2xl font-bold text-bentonville-blue mt-1"><EditableValue initialValue={webinarStat.value} onSave={(val) => onOverallStatChange(findStatIndex('webinar'), val)} ariaLabel="Webinar attendance" inputClassName="text-center" /></p>
                                </div>
                            )}
                            {webinarStat && tallerStat && <div className="w-px bg-gray-200 my-2"></div>}
                            {tallerStat && (
                                <div className="text-center p-3 flex-1">
                                    <p className="text-sm font-semibold text-gray-500">Asistencia Taller</p>
                                    <p className="text-2xl font-bold text-bentonville-blue mt-1"><EditableValue initialValue={tallerStat.value} onSave={(val) => onOverallStatChange(findStatIndex('taller'), val)} ariaLabel="Workshop attendance" inputClassName="text-center" /></p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex flex-col flex-grow">
                <h5 className="font-semibold text-bentonville-blue mb-3 flex-shrink-0">Desglose por Local</h5>
                <div className="overflow-y-auto pr-2 flex-grow">
                     <div className="text-xs text-gray-700">
                        <div className="grid grid-cols-3 gap-2 font-bold bg-gray-100 p-2 rounded-t-md text-bentonville-blue sticky top-0 z-10">
                            <span>Local</span><span className="text-center">Asistencia</span><span className="text-center">Completitud</span>
                        </div>
                        <div className="border-l border-r border-b border-gray-100 rounded-b-md">
                        {breakdown.localStats.map((local, index) => (
                            <div key={index} className={`relative group/item grid grid-cols-3 gap-2 pl-2 pr-8 py-2 items-center ${index === breakdown.localStats.length - 1 ? '' : 'border-b border-gray-100'} ${index % 2 !== 0 ? 'bg-gray-50/60' : 'bg-white'}`}>
                                <span className="font-medium text-sm text-bentonville-blue">
                                    <EditableValue
                                        initialValue={local.localName}
                                        onSave={(val) => onLocalStatChange(index, 'localName', val)}
                                        ariaLabel={`Local name`}
                                    />
                                </span>
                                <span className="text-center font-semibold text-gray-700"><EditableValue initialValue={local.asistencia ?? 'x'} onSave={(val) => onLocalStatChange(index, 'asistencia', val)} ariaLabel={`Asistencia for ${local.localName}`} inputClassName="text-center" /></span>
                                <span className="text-center font-semibold text-gray-700"><EditableValue initialValue={local.completitud ?? 'x'} onSave={(val) => onLocalStatChange(index, 'completitud', val)} ariaLabel={`Completitud for ${local.localName}`} inputClassName="text-center" /></span>
                                <button
                                    onClick={() => onRemoveLocalStat(index)}
                                    className="absolute right-1 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 p-1 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity"
                                    aria-label={`Remove local ${local.localName}`}
                                >
                                    <Icon name="delete" className="text-base" />
                                </button>
                            </div>
                        ))}
                        </div>
                    </div>
                </div>
                <div className="flex-shrink-0">
                    <button onClick={onAddLocalStat} className="mt-2 text-sm text-true-blue font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Icon name="add_circle" className="text-base" /> Añadir Local
                    </button>
                </div>
            </div>
        </div>
    );
};

const EditableHighlightGroupCard: React.FC<{
    marketName: string;
    highlights: (HighlightType & { originalIndex: number })[];
    onAdd: () => void;
    onUpdate: (originalIndex: number, field: keyof HighlightType, newValue: string) => void;
    onRemove: (originalIndex: number) => void;
    onRemoveGroup: () => void;
}> = ({ marketName, highlights, onAdd, onUpdate, onRemove, onRemoveGroup }) => {
    const logoUrl = MARKET_LOGOS[marketName.toLowerCase()];

    return (
        <div className="group bg-white border border-gray-200 p-6 rounded-xl flex flex-col relative">
             <button
                onClick={onRemoveGroup}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label={`Remove ${marketName} highlights group`}
            >
                <Icon name="delete_forever" className="text-lg" />
            </button>
            <div className="border-b border-gray-200 pb-3 mb-4 flex-shrink-0">
                {logoUrl ? <img src={logoUrl} alt={`${marketName} Logo`} className="h-9 object-contain object-left" />
                 : <h4 className="text-xl font-bold text-bentonville-blue flex items-center gap-2"><Icon name="storefront" className="text-true-blue" />{marketName}</h4>}
            </div>
            <div className="flex-grow space-y-3 overflow-y-auto pr-2">
                {highlights.length > 0 ? (
                    highlights.map((highlight) => (
                        <div key={highlight.originalIndex} className="relative group/item flex items-start gap-3">
                            <div className="w-8 text-center">
                                <EditableValue
                                    initialValue={highlight.icon}
                                    onSave={(val) => onUpdate(highlight.originalIndex, 'icon', val)}
                                    ariaLabel={`Icon for highlight`}
                                    className="text-true-blue text-2xl mt-1 text-center"
                                    inputClassName="text-sm text-center"
                                    fullWidth={false}
                                >
                                    <Icon name={highlight.icon} className="text-true-blue text-2xl" />
                                </EditableValue>
                            </div>
                            <p className="text-gray-600 flex-1">
                                <EditableValue
                                    initialValue={highlight.content}
                                    onSave={(val) => onUpdate(highlight.originalIndex, 'content', val)}
                                    ariaLabel={`Highlight content`}
                                />
                            </p>
                            <button
                                onClick={() => onRemove(highlight.originalIndex)}
                                className="absolute right-0 top-1/2 -translate-y-1/2 text-red-500 hover:text-red-700 p-1 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity"
                                aria-label={`Remove highlight`}
                            >
                                <Icon name="delete" className="text-base" />
                            </button>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-400 text-center py-4">No hay destacados para este formato.</p>
                )}
            </div>
             <div className="flex-shrink-0 pt-2">
                <button onClick={onAdd} className="mt-2 text-sm text-true-blue font-semibold flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Icon name="add_circle" className="text-base" /> Añadir Punto
                </button>
            </div>
        </div>
    );
};

const InfographicDisplay: React.FC<{ data: InfographicData }> = ({ data }) => {
    const [editableData, setEditableData] = useState<InfographicData>(data);
    const [deletedMarkets, setDeletedMarkets] = useState<Set<string>>(new Set());

    useEffect(() => {
        const processedData = JSON.parse(JSON.stringify(data)); // Deep copy
        
        processedData.page1.marketSummaries.forEach((summary: MarketSummary) => {
            const hasNoCompletado = summary.statusTable.some(row => row.name.toLowerCase() === 'no completado');
            
            if (!hasNoCompletado) {
                const completadoRow = summary.statusTable.find(r => r.name.toLowerCase() === 'completado');
                const cParticipants = parseInt(completadoRow?.participants || '0', 10);
                const percent = summary.mainPercentage;
                const totalProgram = percent > 0 ? Math.round(cParticipants / (percent / 100)) : cParticipants;
                const noCParticipants = totalProgram - cParticipants;

                const completadoIndex = summary.statusTable.findIndex(r => r.name.toLowerCase() === 'completado');
                const insertIndex = completadoIndex !== -1 ? completadoIndex + 1 : 1;
                
                summary.statusTable.splice(insertIndex, 0, {
                    name: 'No completado',
                    participants: String(noCParticipants),
                    status: `${100 - percent}%`
                });
            }
        });

        setEditableData(processedData);
        setDeletedMarkets(new Set());
    }, [data]);

    const genericUpdater = <T,>(path: (string | number)[], value: T) => {
        setEditableData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            let current: any = newData;
            for (let i = 0; i < path.length - 1; i++) {
                current = current[path[i]];
            }
            current[path[path.length - 1]] = value;
            return newData;
        });
    };

    const handleCompletitudChange = (marketIndex: number, newValueStr: string, changeSource: 'percentage' | 'c_participants' | 'nc_participants' | 'c_status' | 'nc_status') => {
        setEditableData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const summary = newData.page1.marketSummaries[marketIndex];
            const table = summary.statusTable;

            const cIndex = table.findIndex((r: StatusTableRow) => r.name.toLowerCase() === 'completado');
            const ncIndex = table.findIndex((r: StatusTableRow) => r.name.toLowerCase() === 'no completado');

            if (cIndex === -1 || ncIndex === -1) {
                if (changeSource === 'percentage') {
                    let newPercentage = parseInt(newValueStr.replace('%', ''), 10);
                    if (isNaN(newPercentage) || newPercentage < 0) newPercentage = 0;
                    if (newPercentage > 100) newPercentage = 100;
                    summary.mainPercentage = newPercentage;
                }
                return newData;
            }

            let cParticipants = parseInt(table[cIndex].participants, 10) || 0;
            let ncParticipants = parseInt(table[ncIndex].participants, 10) || 0;
            let totalParticipants = cParticipants + ncParticipants;

            if (changeSource === 'percentage' || changeSource === 'c_status' || changeSource === 'nc_status') {
                let newPercentage = parseInt(newValueStr.replace('%', ''), 10);
                if (isNaN(newPercentage)) newPercentage = 0;
                if (newPercentage < 0) newPercentage = 0;
                if (newPercentage > 100) newPercentage = 100;
                
                let cPercentage = newPercentage;
                if (changeSource === 'nc_status') {
                    cPercentage = 100 - newPercentage;
                }
                
                if (totalParticipants > 0) {
                    cParticipants = Math.round(totalParticipants * (cPercentage / 100));
                    ncParticipants = totalParticipants - cParticipants;
                }
            } else if (changeSource === 'c_participants') {
                cParticipants = parseInt(newValueStr, 10) || 0;
            } else if (changeSource === 'nc_participants') {
                ncParticipants = parseInt(newValueStr, 10) || 0;
            }

            totalParticipants = cParticipants + ncParticipants;
            const finalCPercentage = totalParticipants > 0 ? Math.round((cParticipants / totalParticipants) * 100) : 0;
            const finalNCPercentage = 100 - finalCPercentage;
            
            summary.mainPercentage = finalCPercentage;
            table[cIndex].participants = String(cParticipants);
            table[ncIndex].participants = String(ncParticipants);
            table[cIndex].status = `${finalCPercentage}%`;
            table[ncIndex].status = `${finalNCPercentage}%`;
            
            return newData;
        });
    };
    
    const handleMarketSummaryPercentageChange = (marketIndex: number, newPercentageStr: string) => {
        handleCompletitudChange(marketIndex, newPercentageStr, 'percentage');
    };

    const handleMarketSummaryTableChange = (marketIndex: number, rowIndex: number, field: keyof StatusTableRow, newValue: string) => {
        const rowName = editableData.page1.marketSummaries[marketIndex].statusTable[rowIndex]?.name.toLowerCase();

        if ((rowName === 'completado' || rowName === 'no completado') && (field === 'participants' || field === 'status')) {
            let source: 'c_participants' | 'nc_participants' | 'c_status' | 'nc_status';
            if (field === 'participants') {
                source = rowName === 'completado' ? 'c_participants' : 'nc_participants';
            } else { // status
                source = rowName === 'completado' ? 'c_status' : 'nc_status';
            }
            handleCompletitudChange(marketIndex, newValue, source);
        } else {
            setEditableData(prevData => {
                const newData = JSON.parse(JSON.stringify(prevData));
                const row = newData.page1.marketSummaries[marketIndex].statusTable[rowIndex];
                if(row) {
                    row[field] = newValue;
                }
                return newData;
            });
        }
    };
    
    const handleAddBar = (marketIndex: number) => {
        setEditableData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const barChartData: ChartDataPoint[] = newData.page1.marketSummaries[marketIndex].barChartData;
            const newBarName = (barChartData.length + 1).toString();
            barChartData.push({ name: newBarName, value: 50 });
            return newData;
        });
    };

    const handleRemoveBar = (marketIndex: number, barIndex: number) => {
        setEditableData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            newData.page1.marketSummaries[marketIndex].barChartData.splice(barIndex, 1);
            return newData;
        });
    };

    const handleBarValueChange = (marketIndex: number, barIndex: number, newValueStr: string) => {
        let newValue = parseInt(newValueStr, 10);
        if (isNaN(newValue)) newValue = 0;
        if (newValue < 0) newValue = 0;
        if (newValue > 100) newValue = 100;
        genericUpdater(['page1', 'marketSummaries', marketIndex, 'barChartData', barIndex, 'value'], newValue);
    };

    const handleBarColorChange = (marketIndex: number, barIndex: number, newColor: string) => {
        genericUpdater(['page1', 'marketSummaries', marketIndex, 'barChartData', barIndex, 'fill'], newColor);
    };

    const handleAddLocalStat = (marketIndex: number) => {
        setEditableData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const localStats: MarketLocalStat[] = newData.page2.marketBreakdowns[marketIndex].localStats;
            localStats.push({
                localName: 'Nuevo Local',
                asistencia: '0%',
                completitud: '0%'
            });
            return newData;
        });
    };

    const handleRemoveLocalStat = (marketIndex: number, localIndex: number) => {
        setEditableData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            newData.page2.marketBreakdowns[marketIndex].localStats.splice(localIndex, 1);
            return newData;
        });
    };

    const handleAddHighlight = (marketName: string) => {
        setEditableData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            const newHighlight: HighlightType = {
                marketName: marketName,
                icon: 'add_task',
                content: 'Nuevo punto destacado.'
            };
            if (!newData.page3.highlights) newData.page3.highlights = [];
            newData.page3.highlights.push(newHighlight);
            return newData;
        });
    };

    const handleUpdateHighlight = (highlightIndex: number, field: keyof HighlightType, newValue: string) => {
        genericUpdater(['page3', 'highlights', highlightIndex, field], newValue);
    };

    const handleRemoveHighlight = (highlightIndex: number) => {
         setEditableData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            newData.page3.highlights.splice(highlightIndex, 1);
            return newData;
        });
    };

    const handleRemoveMarketHighlightGroup = (marketName: string) => {
         setEditableData(prevData => {
            const newData = JSON.parse(JSON.stringify(prevData));
            newData.page3.highlights = newData.page3.highlights.filter(
                (h: HighlightType) => h.marketName !== marketName
            );
            return newData;
        });
        setDeletedMarkets(prev => new Set(prev).add(marketName));
    };

    const handleAddMarketHighlightGroup = (marketName: string) => {
        setDeletedMarkets(prev => {
            const newSet = new Set(prev);
            newSet.delete(marketName);
            return newSet;
        });
    };
    
    const highlightsByMarket = useMemo(() => {
        if (!editableData?.page3?.highlights) return {};
        return editableData.page3.highlights.reduce((acc, highlight, index) => {
            const market = highlight.marketName;
            if (!acc[market]) {
                acc[market] = [];
            }
            acc[market].push({ ...highlight, originalIndex: index });
            return acc;
        }, {} as Record<string, (HighlightType & { originalIndex: number })[]>);
    }, [editableData.page3?.highlights]);

    const allMarkets = ['Lider', 'Express', 'SBA', 'CM'];
    const displayedMarketGroups = allMarkets.filter(m => !deletedMarkets.has(m));
    const availableMarketsToAdd = allMarkets.filter(m => deletedMarkets.has(m));

    if (!editableData) return null;

  return (
    <div className="w-full flex flex-col items-center">
        <div className="mb-8 w-full max-w-4xl flex justify-center">
            <button
                onClick={() => exportToPdf('infographic-pages')}
                className="bg-true-blue text-white font-bold py-3 px-6 rounded-lg text-lg flex items-center gap-2"
            >
                <Icon name="download" />
                Exportar a PDF
            </button>
        </div>
      
        <div id="infographic-pages">
            {/* Page 1 */}
            <Page>
                <header className="flex justify-between items-start pb-4 mb-4">
                    <img src={WALMART_CHILE_BLUE_LOGO_URL} alt="Walmart Chile Logo" className="h-10" />
                    <div className="text-right">
                        <h2 className="text-3xl font-extrabold text-bentonville-blue">{editableData.page1.mainTitle}</h2>
                        <p className="text-gray-500 font-semibold">
                            <EditableValue
                                initialValue={editableData.page1.date}
                                onSave={(val) => genericUpdater(['page1', 'date'], val)}
                                ariaLabel="Fecha de la infografía"
                                className="text-gray-500 font-semibold text-right"
                                inputClassName="text-right font-semibold"
                            />
                        </p>
                    </div>
                </header>
                <section className="my-8 flex gap-6">
                    {editableData.page1.mainKpis.map((kpi, index) => {
                         const colors = kpiCardColors[index % kpiCardColors.length];
                         return (
                            <div key={kpi.label} className={`flex flex-col items-center justify-center p-6 rounded-2xl flex-1 text-center ${colors.bg} ${colors.text}`}>
                                <span className={`text-6xl font-black ${colors.value}`}>
                                    <EditableValue
                                        initialValue={kpi.value}
                                        onSave={(val) => genericUpdater(['page1', 'mainKpis', index, 'value'], val)}
                                        ariaLabel={`KPI value for ${kpi.label}`}
                                        inputClassName={`${colors.bg} text-center`}
                                    />
                                </span>
                                <h3 className="text-xl font-bold mt-2">{kpi.label}</h3>
                                <p className={`text-sm mt-1 ${colors.bg === 'bg-sky-blue' ? 'text-gray-600' : 'text-white/80'}`}>{kpi.description}</p>
                            </div>
                         );
                    })}
                </section>
                <section className="flex flex-col">
                    <h3 className="text-2xl font-bold text-bentonville-blue text-center mb-6 flex items-center justify-center gap-2">
                        <Icon name="grouped_bar_chart" />
                        Completitud Total Mercados
                    </h3>
                    <div className="grid grid-cols-2 gap-6">
                        {editableData.page1.marketSummaries.map((summary, index) => 
                            <MarketSummaryCard 
                                key={summary.marketName} 
                                summary={summary}
                                onPercentageChange={(val) => handleMarketSummaryPercentageChange(index, val)}
                                onStatusTableChange={(rowIndex, field, newValue) => handleMarketSummaryTableChange(index, rowIndex, field, newValue)}
                                onAddBar={() => handleAddBar(index)}
                                onRemoveBar={(barIndex) => handleRemoveBar(index, barIndex)}
                                onBarValueChange={(barIndex, newValue) => handleBarValueChange(index, barIndex, newValue)}
                                onBarColorChange={(barIndex, newColor) => handleBarColorChange(index, barIndex, newColor)}
                             />
                        )}
                    </div>
                </section>
            </Page>

            {/* Page 2 */}
            <Page>
                 <header className="flex justify-between items-start pb-4 mb-8">
                    <img src={WALMART_CHILE_BLUE_LOGO_URL} alt="Walmart Chile Logo" className="h-10" />
                    <div className="text-right">
                        <h2 className="text-3xl font-extrabold text-bentonville-blue">{editableData.page2.mainTitle}</h2>
                         <p className="text-gray-500 font-semibold">
                            <EditableValue
                                initialValue={editableData.page1.date}
                                onSave={(val) => genericUpdater(['page1', 'date'], val)}
                                ariaLabel="Fecha de la infografía"
                                className="text-gray-500 font-semibold text-right"
                                inputClassName="text-right font-semibold"
                            />
                        </p>
                    </div>
                </header>
                <section className="grid grid-cols-2 gap-8 mb-8 items-start">
                     {editableData.page2.marketBreakdowns.map((breakdown, index) => 
                        <MarketBreakdownCard 
                            key={breakdown.marketName} 
                            breakdown={breakdown}
                            onOverallStatChange={(statIndex, newValue) => genericUpdater(['page2', 'marketBreakdowns', index, 'overallStats', statIndex, 'value'], newValue)}
                            onLocalStatChange={(statIndex, field, newValue) => genericUpdater(['page2', 'marketBreakdowns', index, 'localStats', statIndex, field], newValue)}
                            onAddLocalStat={() => handleAddLocalStat(index)}
                            onRemoveLocalStat={(localIndex) => handleRemoveLocalStat(index, localIndex)}
                        />
                    )}
                </section>
            </Page>

            {/* Page 3 */}
            {editableData.page3 && (
                <Page>
                    <header className="flex justify-between items-start pb-4 mb-8">
                        <img src={WALMART_CHILE_BLUE_LOGO_URL} alt="Walmart Chile Logo" className="h-10" />
                        <div className="text-right">
                            <h2 className="text-3xl font-extrabold text-bentonville-blue">{editableData.page3.mainTitle}</h2>
                             <p className="text-gray-500 font-semibold">
                                <EditableValue
                                    initialValue={editableData.page1.date}
                                    onSave={(val) => genericUpdater(['page1', 'date'], val)}
                                    ariaLabel="Fecha de la infografía"
                                    className="text-gray-500 font-semibold text-right"
                                    inputClassName="text-right font-semibold"
                                />
                            </p>
                        </div>
                    </header>
                    <section className="flex flex-col flex-grow">
                        <h3 className="text-2xl font-bold text-bentonville-blue text-center mb-6 flex items-center justify-center gap-2">
                            <Icon name="military_tech" className="text-true-blue" />
                            {editableData.page3.highlightsTitle}
                        </h3>
                        <div className="grid grid-cols-2 gap-6 items-start">
                             {displayedMarketGroups.map((marketName) => {
                                const highlights = highlightsByMarket[marketName] || [];
                                return (
                                    <EditableHighlightGroupCard
                                        key={marketName}
                                        marketName={marketName}
                                        highlights={highlights}
                                        onAdd={() => handleAddHighlight(marketName)}
                                        onUpdate={handleUpdateHighlight}
                                        onRemove={handleRemoveHighlight}
                                        onRemoveGroup={() => handleRemoveMarketHighlightGroup(marketName)}
                                    />
                                );
                            })}
                        </div>
                        {availableMarketsToAdd.length > 0 && (
                            <div className="mt-6 pt-6 border-t border-dashed">
                                <h4 className="font-semibold text-center text-gray-600 mb-3">Añadir sección de destacados</h4>
                                <div className="flex justify-center gap-4">
                                    {availableMarketsToAdd.map(market => (
                                        <button
                                            key={market}
                                            onClick={() => handleAddMarketHighlightGroup(market)}
                                            className="capitalize bg-gray-100 hover:bg-true-blue/10 text-bentonville-blue font-semibold py-2 px-4 rounded-lg flex items-center gap-2"
                                        >
                                            <Icon name="add" /> {market}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </section>
                </Page>
            )}
        </div>
    </div>
  );
};

export default InfographicDisplay;