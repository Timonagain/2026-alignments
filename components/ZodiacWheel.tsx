
import React, { useEffect, useRef, useMemo, useImperativeHandle, forwardRef } from 'react';
import * as d3 from 'd3';
import { Planet, ZodiacSign, Aspect } from '../types';
import { ZODIAC_SIGNS, PLANETS, EVENT_DATE, START_DATE, CelestialEvent } from '../constants';

export interface ZodiacWheelRef {
  zoomIn: () => void;
  zoomOut: () => void;
  recenter: () => void;
}

interface ZodiacWheelProps {
  currentTime: Date;
  hoveredPlanet: string | null;
  selectedPlanet: Planet | null;
  selectedSign: ZodiacSign | null;
  selectedAspect: Aspect | null;
  selectedEvent: CelestialEvent | null;
  activeAspects: Aspect[];
  onPlanetClick: (planet: Planet | null) => void;
  onSignClick: (sign: ZodiacSign | null) => void;
  onAspectClick: (aspect: Aspect | null) => void;
}

const ZodiacWheel = forwardRef<ZodiacWheelRef, ZodiacWheelProps>(({ 
  currentTime, hoveredPlanet, selectedPlanet, selectedSign, selectedAspect, selectedEvent, activeAspects,
  onPlanetClick, onSignClick, onAspectClick
}, ref) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const mainGRef = useRef<SVGGElement>(null);
  const zoomRef = useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>(null);

  const width = 1000, height = 1000;
  const outerR = 480, innerR = 425;

  useImperativeHandle(ref, () => ({
    zoomIn: () => { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(600).call(zoomRef.current.scaleBy, 1.5); },
    zoomOut: () => { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(600).call(zoomRef.current.scaleBy, 0.6); },
    recenter: () => handleFullRecenter()
  }));

  const getMoonPhaseGlyph = (mDeg: number, sDeg: number) => {
    let diff = mDeg - sDeg;
    if (diff < 0) diff += 360;
    if (diff < 22.5 || diff >= 337.5) return '🌑';
    if (diff < 67.5) return '🌒';
    if (diff < 112.5) return '🌓';
    if (diff < 157.5) return '🌔';
    if (diff < 202.5) return '🌕';
    if (diff < 247.5) return '🌖';
    if (diff < 292.5) return '🌗';
    return '🌘';
  };

  const internalState = useMemo(() => {
    const deltaMs = currentTime.getTime() - EVENT_DATE.getTime();
    const deltaDays = deltaMs / (1000 * 60 * 60 * 24);
    const totalElapsedDays = (currentTime.getTime() - START_DATE.getTime()) / (1000 * 60 * 60 * 24);
    const sunBase = ZODIAC_SIGNS.findIndex(s => s.name === 'Capricorn') * 30;
    const sunDeg = (sunBase + totalElapsedDays) % 360;

    const planets = PLANETS.map(p => {
      const signIndex = ZODIAC_SIGNS.findIndex(s => s.name === p.sign);
      const baseTotalDegrees = (signIndex !== -1 ? signIndex : 0) * 30 + p.degree;
      let currentTotalDegrees = (baseTotalDegrees + (p.dailySpeed * deltaDays)) % 360;
      if (currentTotalDegrees < 0) currentTotalDegrees += 360;
      
      let trackR = innerR - 85; 
      if (!p.isPrimary) trackR = innerR - 210;
      if (p.name === 'Uranus' || p.name === 'Pluto') trackR = innerR - 290;
      
      const angle = (currentTotalDegrees * Math.PI) / 180;
      return { ...p, currentDegrees: currentTotalDegrees, x: trackR * Math.sin(angle) + width / 2, y: -trackR * Math.cos(angle) + height / 2 };
    });

    const sunObj = planets.find(p => p.name === 'Sun');

    return { planets, sunDeg: sunDeg < 0 ? sunDeg + 360 : sunDeg, sunPos: sunObj };
  }, [currentTime]);

  const { planets: calculatedPlanets, sunDeg, sunPos } = internalState;

  useEffect(() => {
    if (!svgRef.current || !mainGRef.current) return;
    const svg = d3.select(svgRef.current), mainG = d3.select(mainGRef.current);
    
    zoomRef.current = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 20])
      .on('zoom', (event) => mainG.attr('transform', event.transform));
      
    svg.call(zoomRef.current as any);
    
    const initialScale = window.innerWidth < 768 ? 0.35 : 0.8;
    svg.call(zoomRef.current.transform, d3.zoomIdentity.translate(0, 0).scale(initialScale));

    mainG.selectAll('*').remove();
    
    mainG.append('rect')
      .attr('width', width * 10).attr('height', height * 10)
      .attr('x', -width * 5).attr('y', -height * 5).attr('fill', 'transparent')
      .on('click', () => { onPlanetClick(null); onSignClick(null); onAspectClick(null); });

    mainG.append('g').attr('class', 'zodiac-ring');

    const ringLayer = mainG.select('.zodiac-ring');
    const arc = d3.arc<any>().innerRadius(innerR).outerRadius(outerR).startAngle((d, i) => (i * 30 * Math.PI) / 180).endAngle((d, i) => ((i + 1) * 30 * Math.PI) / 180).padAngle(0.002).cornerRadius(4);
    
    const signSegments = ringLayer.selectAll('.sign-segment').data(ZODIAC_SIGNS).enter().append('g').attr('class', 'sign-segment cursor-pointer').on('click', (event, d) => { event.stopPropagation(); onSignClick(d); });
    signSegments.append('path').attr('d', arc).attr('transform', `translate(${width/2}, ${height/2})`).attr('fill', '#020408').attr('stroke', '#1e293b').attr('stroke-width', 1.5).attr('opacity', 0.8);
    signSegments.append('text').attr('transform', (d, i) => { const [cx, cy] = arc.centroid(d as any, i); return `translate(${cx + width/2}, ${cy + height/2 + 10})`; }).attr('text-anchor', 'middle').attr('fill', '#475569').attr('font-size', '34px').attr('font-family', 'Inter').text(d => d.symbol);

    mainG.append('g').attr('class', 'sun-ray-layer');
    mainG.append('g').attr('class', 'aspect-layer');
    mainG.append('g').attr('class', 'planets-layer');
  }, []);

  useEffect(() => {
    if (!svgRef.current || !zoomRef.current) return;
    const svg = d3.select(svgRef.current);

    if (selectedPlanet) {
      const target = calculatedPlanets.find(p => p.name === selectedPlanet.name);
      if (target) {
        const scale = 5.5;
        const tx = (width / 2) - (target.x * scale), ty = (height / 2) - (target.y * scale);
        svg.transition().duration(1800).ease(d3.easeExpInOut).call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }
    } else if (selectedSign) {
      const idx = ZODIAC_SIGNS.findIndex(s => s.name === selectedSign.name);
      const angle = (idx * 30 + 15) * Math.PI / 180;
      const r = innerR + (outerR - innerR) / 2;
      const tx_raw = r * Math.sin(angle) + width / 2, ty_raw = -r * Math.cos(angle) + height / 2;
      const scale = 3.5;
      const tx = (width / 2) - (tx_raw * scale), ty = (height / 2) - (ty_raw * scale);
      svg.transition().duration(1800).ease(d3.easeExpInOut).call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    } else if (selectedAspect) {
      const p1 = calculatedPlanets.find(p => p.name === selectedAspect.planet1), p2 = calculatedPlanets.find(p => p.name === selectedAspect.planet2);
      if (p1 && p2) {
        const midX = (p1.x + p2.x) / 2, midY = (p1.y + p2.y) / 2;
        const scale = 3.2;
        const tx = (width / 2) - (midX * scale), ty = (height / 2) - (midY * scale);
        svg.transition().duration(1800).ease(d3.easeExpInOut).call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
      }
    } else if (selectedEvent) {
      // Zoom logic for specific events - find the primary object involved
      let focalX = width / 2, focalY = height / 2, scale = 2.0;
      
      const objectName = selectedEvent.object.split('/')[0];
      const planet = calculatedPlanets.find(p => p.name.includes(objectName) || objectName.includes(p.name));
      
      if (planet) {
        focalX = planet.x; focalY = planet.y; scale = 4.0;
      } else if (selectedEvent.id === 'great-align') {
        // Zoom to the 0 Aries point
        const r = innerR - 50;
        focalX = width / 2; focalY = height / 2 - r; scale = 5.0;
      }

      const tx = (width / 2) - (focalX * scale), ty = (height / 2) - (focalY * scale);
      svg.transition().duration(1800).ease(d3.easeExpInOut).call(zoomRef.current.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
    } else {
      // Automatic Zoom out when nothing is selected
      handleFullRecenter();
    }
  }, [selectedPlanet, selectedSign, selectedAspect, selectedEvent]);

  useEffect(() => {
    if (!mainGRef.current) return;
    const planetsLayer = d3.select(mainGRef.current).select('.planets-layer');
    const aspectLayer = d3.select(mainGRef.current).select('.aspect-layer');
    const rayLayer = d3.select(mainGRef.current).select('.sun-ray-layer');

    // Draw Sun Rays
    rayLayer.selectAll('*').remove();
    if (sunPos) {
      const rayGradient = rayLayer.append('defs').append('radialGradient')
        .attr('id', 'sunRayGrad')
        .attr('cx', '50%').attr('cy', '50%').attr('r', '50%');
      rayGradient.append('stop').attr('offset', '0%').attr('stop-color', '#fbbf24').attr('stop-opacity', 0.4);
      rayGradient.append('stop').attr('offset', '100%').attr('stop-color', '#fbbf24').attr('stop-opacity', 0);

      rayLayer.append('line')
        .attr('x1', sunPos.x).attr('y1', sunPos.y)
        .attr('x2', width / 2).attr('y2', height / 2)
        .attr('stroke', 'url(#sunRayGrad)')
        .attr('stroke-width', 60)
        .attr('stroke-linecap', 'round')
        .attr('opacity', 0.3);
        
      rayLayer.append('circle')
        .attr('cx', width/2).attr('cy', height/2)
        .attr('r', 10)
        .attr('fill', '#fbbf24')
        .attr('opacity', 0.2);
    }

    const enrichedAspects = activeAspects.map(a => {
      const p1 = calculatedPlanets.find(cp => cp.name === a.planet1), p2 = calculatedPlanets.find(cp => cp.name === a.planet2);
      return { ...a, p1, p2 };
    });

    const aspectsSel = aspectLayer.selectAll<SVGLineElement, any>('.link').data(enrichedAspects, (d: any) => `${d.planet1}-${d.planet2}`);
    aspectsSel.exit().remove();
    aspectsSel.enter().append('line').attr('class', 'link cursor-pointer').on('click', (event, d) => { event.stopPropagation(); onAspectClick(d); })
      .merge(aspectsSel as any).attr('x1', d => d.p1?.x).attr('y1', d => d.p1?.y).attr('x2', d => d.p2?.x).attr('y2', d => d.p2?.y)
      .attr('stroke', d => d.color).attr('stroke-width', d => (d.type === 'conjunction' ? 14 : 3)).attr('opacity', 0.15).attr('stroke-dasharray', d => d.type === 'conjunction' ? 'none' : '10,10');

    const planetNodes = planetsLayer.selectAll<SVGGElement, any>('.marker').data(calculatedPlanets, (d: any) => d.name);
    const enter = planetNodes.enter().append('g').attr('class', 'marker cursor-pointer').on('click', (event, d) => { event.stopPropagation(); onPlanetClick(d); });
    enter.append('circle').attr('class', 'glow');
    enter.append('circle').attr('class', 'base');
    enter.append('text').attr('class', 'symbol');

    planetNodes.merge(enter as any).each(function(d) {
      const g = d3.select(this), isFocused = hoveredPlanet === d.name || selectedPlanet?.name === d.name;
      const scaleMultiplier = d.isPrimary ? 1.0 : 0.45; 
      const isMoon = d.name === 'Moon';

      g.select('.glow').attr('cx', d.x).attr('cy', d.y).attr('r', isFocused ? 100 : 75 * scaleMultiplier).attr('fill', d.color).attr('opacity', isFocused ? 0.4 : 0.1).style('filter', 'blur(20px)');
      g.select('.base').attr('cx', d.x).attr('cy', d.y).attr('r', isFocused ? 48 : 38 * scaleMultiplier).attr('fill', isFocused ? d.color : '#020408').attr('stroke', isFocused ? '#fff' : d.color).attr('stroke-width', isFocused ? 5 : 3 * scaleMultiplier);
      g.select('.symbol').attr('x', d.x).attr('y', d.y + (15 * scaleMultiplier)).attr('text-anchor', 'middle').attr('fill', isFocused ? '#000' : d.color).attr('font-size', (isFocused ? 44 : 32 * scaleMultiplier) + 'px').attr('font-weight', '700').attr('font-family', 'Inter').text(isMoon ? getMoonPhaseGlyph(d.currentDegrees, sunDeg) : d.symbol);
    });
  }, [calculatedPlanets, hoveredPlanet, selectedPlanet, selectedAspect, selectedEvent, activeAspects, sunDeg, sunPos]);

  const handleFullRecenter = () => { if (svgRef.current && zoomRef.current) d3.select(svgRef.current).transition().duration(2200).ease(d3.easeExpInOut).call(zoomRef.current.transform, d3.zoomIdentity.translate(0, 0).scale(window.innerWidth < 768 ? 0.35 : 0.8)); };

  return (
    <div className="w-full h-full flex items-center justify-center relative overflow-hidden bg-transparent">
      <svg ref={svgRef} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet" className="z-10 overflow-hidden max-w-full max-h-full w-full h-full cursor-move outline-none drop-shadow-[0_0_100px_rgba(0,0,0,0.5)]">
        <g ref={mainGRef} />
      </svg>
    </div>
  );
});

export default ZodiacWheel;
