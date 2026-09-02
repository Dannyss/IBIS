import React from 'react';
import '../css/Cabecera.css';

class BarraProgreso extends React.Component {
    
    
    render() {

        return <><div className="progress">
        <div className="progress-bar" style={this.props.style}>
            <span className="progress-bar-text">0%</span>
        </div>
    </div></>
    }

}
export default BarraProgreso;