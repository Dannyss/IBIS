import React from 'react';
import '../css/Cabecera.css';
class CabeceraTitulo extends React.Component {
    render() {

        return <><div className='titulo'>
            <div className="elemento tamlet2em color">{this.props.titulo}</div>  
        </div></>
    }

}
export default CabeceraTitulo;