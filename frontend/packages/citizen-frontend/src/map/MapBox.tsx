import React, { useMemo } from 'react'
import styled from 'styled-components'
import { defaultMargins } from '@evaka/lib-components/src/white-space'
import colors from '@evaka/lib-components/src/colors'
import leaflet from 'leaflet'
import { FooterContent } from '~Footer'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import { PublicUnit } from '@evaka/lib-common/src/api-types/units/PublicUnit'
import marker from './marker.svg'
import markerHighlight from './marker-highlight.svg'

export interface Props {
  units: PublicUnit[]
  selectedUnit: PublicUnit | null
}

export default React.memo(function MapBox({ units, selectedUnit }: Props) {
  const icon = useMemo(() => new leaflet.Icon({ iconUrl: marker }), [marker])
  const highlightIcon = useMemo(
    () => new leaflet.Icon({ iconUrl: markerHighlight }),
    [markerHighlight]
  )
  return (
    <Wrapper className="map-box">
      <Map center={[60.184147, 24.704897]} zoom={12}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {units.map(({ id, location }) => {
          if (location?.lat == null || location?.lon == null) return null
          const isSelected = selectedUnit?.id === id
          return (
            <Marker
              key={id}
              position={[location.lat, location.lon]}
              icon={isSelected ? highlightIcon : icon}
            />
          )
        })}
      </Map>
      <FooterWrapper>
        <FooterContent />
      </FooterWrapper>
    </Wrapper>
  )
})

const Wrapper = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  flex-grow: 100;
  flex-shrink: 0;

  display: flex;
  flex-direction: column;
  align-items: stretch;
`

const Map = styled(MapContainer)`
  flex-grow: 1;
  width: 100%;
  min-height: 500px;
`

const FooterWrapper = styled.div`
  position: absolute;
  left: 0;
  bottom: 0;
  width: fit-content;
  background-color: ${colors.greyscale.white};

  > div {
    margin: 0 ${defaultMargins.s} 0;
  }

  @media (max-width: 600px) {
    position: unset;
    width: 100%;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-evenly;

    div:first-child {
      width: 100%;
      text-align: center;
    }
  }
`
