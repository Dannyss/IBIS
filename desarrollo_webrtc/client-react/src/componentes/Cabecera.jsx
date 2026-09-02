import React from 'react';
import '../css/Cabecera.css';
//import CabeceraTitulo from './CabeceraTitulo';
//import ModuloProgreso from './ModuloProgreso';
import LinkRutas from './rutas/LinkRutas';
class Cabecera extends React.Component {

    render() {
/*
                    <ModuloProgreso modulo='Programación Entorno Cliente'></ModuloProgreso>
                    <CabeceraTitulo titulo='Curso 2023/2024'></CabeceraTitulo>
*/
        return (
            <>
                <header className='contenedor-global-cabecera'>
                    
                    <LinkRutas/>
                    
                </header>
            </>
        );
    }
}
export default Cabecera;