import React from 'react';
import '../css/Cabecera.css';
import BarraProgreso from './BarraProgreso';

class ModuloProgreso extends React.Component {
    render() {
        const progressBar = { width: '0%' }
        return <>
        <div className='modulo'>
        <div className="elemento color">
        <span className="modulo-text">{this.props.modulo}</span>
            <BarraProgreso style={progressBar}></BarraProgreso>
        </div>
    </div></>
    }

}
export default ModuloProgreso;