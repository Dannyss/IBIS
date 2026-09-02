import React from 'react';
import '../../css/Cabecera.css';
import { Link } from 'react-router-dom';
import Logout from '../formularios/Logout';
class LinkRutas extends React.Component {
    render() {

        return <><div className='titulo'>
            <div className="elemento color">
                <Link to="/">Inicio</Link>
                <Link to="/alta-curso">Alta Curso</Link>
                <Link to="/nueva-coleccion">Nueva Coleccion</Link>
                <Logout/>
            </div>

        </div></>    }

}
export default LinkRutas;

